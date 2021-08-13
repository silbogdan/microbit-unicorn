let FLASH_ADDRESS = 0x00000000;
let FLASH_SIZE =  256*1024;
let RAM_ADDRESS = 0x20000000;
let MAX_RAM_SIZE = 128*1024;
let ram_size = 128 * 1024;
let sp = RAM_ADDRESS + ram_size;
let INSTRUCTIONS_COUNT = 0;

var d = new cs.Capstone(cs.ARCH_ARM, cs.MODE_THUMB);
var e = new uc.Unicorn(uc.ARCH_ARM, uc.MODE_THUMB);

// Instruction Pointer
function pcRead() {
    // console.log('Reading PC: ' + e.reg_read_i32(uc.ARM_REG_PC));
    return e.reg_read_i32(uc.ARM_REG_PC);
}
function pcWrite(value) {
    console.log('Writing PC: ' + e.reg_write_i32(uc.ARM_REG_PC, value));
    return e.reg_write_i32(uc.ARM_REG_PC, value);
}

// Customization
$('title').html('Unicorn.js: MicroBIT');
$('.navbar-demo').html('MicroBIT');

// Registers
paneRegisters.add(new Register('R0',  'i32', uc.ARM_REG_R0));
paneRegisters.add(new Register('R1',  'i32', uc.ARM_REG_R1));
paneRegisters.add(new Register('R2',  'i32', uc.ARM_REG_R2));
paneRegisters.add(new Register('R3',  'i32', uc.ARM_REG_R3));
paneRegisters.add(new Register('R4',  'i32', uc.ARM_REG_R4));
paneRegisters.add(new Register('R5',  'i32', uc.ARM_REG_R5));
paneRegisters.add(new Register('R6',  'i32', uc.ARM_REG_R6));
paneRegisters.add(new Register('R7',  'i32', uc.ARM_REG_R7));
paneRegisters.add(new Register('R8',  'i32', uc.ARM_REG_R8));
paneRegisters.add(new Register('R9',  'i32', uc.ARM_REG_R9));
paneRegisters.add(new Register('R10', 'i32', uc.ARM_REG_R10));
paneRegisters.add(new Register('R11', 'i32', uc.ARM_REG_R11));
paneRegisters.add(new Register('R12', 'i32', uc.ARM_REG_R12));
paneRegisters.add(new Register('SP',  'i32', uc.ARM_REG_R13));
paneRegisters.add(new Register('LR',  'i32', uc.ARM_REG_R14));
paneRegisters.add(new Register('PC',  'i32', uc.ARM_REG_R15));
paneRegisters.update();

function read_fn (handle, type, addr_lo, addr_hi, size, value_lo, value_hi, user_data) {
    console.log (`mem read 0x${addr_lo.toString(16)}`); 
}


function write_fn (handle, type, addr_lo, addr_hi, size, value_lo, value_hi, user_data) {
    console.log (`mem write 0x${addr_lo.toString(16)} -> 0x${value_lo.toString(16)}`); 
}

function read_unmapped_fn (handle, type, addr_lo, addr_hi, size, value_lo, value_hi, user_data) {
    console.log (`mem read unmapped 0x${addr_lo.toString(16)}`); 
    console.log (`pc: 0x${pcRead().toString(16)}`);
    console.log (`sp: 0x${e.reg_read_i32(uc.ARM_REG_SP).toString(16)}`);
    let mem = e.mem_read (pcRead(), 2);
    console.log (mem);
    let disasm = d.disasm (mem, 0);
    if (disasm[0])
    {
        console.log ("executing " + pcRead().toString (16) + " -> " + disasm[0].mnemonic + " " + disasm[0].op_str);
    }
}

function write_unmapped_fn (handle, type, addr_lo, addr_hi, size, value_lo, value_hi, user_data) {
    console.log (`mem write unmapped 0x${(addr_lo>>>0).toString(16)} -> 0x${(value_lo>>>0).toString(16)}`); 
    console.log (`pc: 0x${pcRead().toString(16)}`);
    console.log (`sp: 0x${e.reg_read_i32(uc.ARM_REG_SP).toString(16)}`);
    let mem = e.mem_read (pcRead(), 2);
    let disasm = d.disasm (mem, 0);
    if (disasm[0])
    {
        console.log ("executing " + pcRead().toString (16) + " -> " + disasm[0].mnemonic + " " + disasm[0].op_str);
    }
}

function interrupt_fn (handle, type, addr_lo, addr_hi, size, value_lo, value_hi, user_data) {
    // console.log ("interrupt");
    console.log (handle);
    console.log (`interrupt 0x${(addr_lo>>>0).toString(16)} -> 0x${(value_lo>>>0).toString(16)}`); 
    console.log (`pc: 0x${pcRead().toString(16)}`);
    console.log (`sp: 0x${e.reg_read_i32(uc.ARM_REG_SP).toString(16)}`);
    let mem = e.mem_read (pcRead()-2, 2);
    console.log (mem);
    let disasm = d.disasm (mem, 0);
    if (disasm[0])
    {
        console.log ("executing " + pcRead().toString (16) + " -> " + disasm[0].mnemonic + " " + disasm[0].op_str);
    }
}


main();
async function main() {
    let firmware = await loadFirmware();

    console.log (firmware);

    console.log (firmware[0] + (firmware[1] << 8) + (firmware[2] << 16) + (firmware[3] << 24));
    console.log (firmware[4] + (firmware[5] << 8) + (firmware[6] << 16) + (firmware[7] << 24));
    
    e.reg_write_i32(uc.ARM_REG_SP, firmware[0] + (firmware[1] << 8) + (firmware[2] << 16) + (firmware[3] << 24));
    e.reg_write_i32(uc.ARM_REG_PC, firmware[4] + (firmware[5] << 8) + (firmware[6] << 16) + (firmware[7] << 24));
    // e.reg_write_i32(uc.ARM_REG_PC, 0x11144);
    
    e.mem_map(FLASH_ADDRESS, FLASH_SIZE, uc.PROT_ALL);
    e.mem_map(RAM_ADDRESS, MAX_RAM_SIZE, uc.PROT_ALL);

    e.mem_write(FLASH_ADDRESS, firmware);

    // e.hook_add (uc.HOOK_MEM_WRITE, write_fn, 0, RAM_ADDRESS, RAM_ADDRESS+MAX_RAM_SIZE, 0);
    // e.hook_add (uc.HOOK_MEM_READ, read_fn, 0, RAM_ADDRESS, RAM_ADDRESS+MAX_RAM_SIZE, 0);
    e.hook_add (uc.HOOK_MEM_READ_UNMAPPED, read_unmapped_fn);
    e.hook_add (uc.HOOK_MEM_WRITE_UNMAPPED, write_unmapped_fn);
    e.hook_add (uc.HOOK_INTR, interrupt_fn);

    function execution () {

        try
        {
            let pc = pcRead ();
            let mem = e.mem_read (pc, 2);
            let disasm = d.disasm (mem, 0);
            if (disasm[0]) {
                console.log ("executing " + pc.toString (16) + " -> " + disasm[0].mnemonic + " " + disasm[0].op_str);
            }
            e.emu_start(pc | 1, FLASH_ADDRESS+FLASH_SIZE, 0, -1);
            // lpc = pcRead ();
            // mem = e.mem_read (pc, 2);
            // disasm = d.disasm (mem, 0);
            // console.log ("executing " + pc.toString (16) + " -> " + disasm[0].mnemonic + " " + disasm[0].op_str);
            setTimeout (execution, 0);
        }
        catch (err) {
            console.log (err    );
            // let pc = pcRead ();
            // let mem = e.mem_read (pc, 2);
            // let disasm = d.disasm (mem, 0);
            // console.log ("executing " + pc.toString (16) + " -> " + disasm[0].mnemonic + " " + disasm[0].op_str);
        }
    }

    execution ();
}

function int_to_bytes(n) {
	return new Uint8Array([n, n >> 8, n >> 16, n >> 24]);
}

async function loadFirmware() {
    let firmware = await fetch('http://localhost:8080/');
    firmware = await firmware.json();
    firmware = new Uint8Array(firmware.file.data);
    return firmware;
}