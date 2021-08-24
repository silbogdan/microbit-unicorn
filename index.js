const uc = require('./dist/unicorn-arm.min.js');
const cs = require('./demos/externals/capstone-arm.min.js');
const fs = require('fs');

//ADDRESS
let FLASH_ADDRESS = 0x00000000;
let FLASH_SIZE =  256*1024;
let RAM_ADDRESS = 0x20000000;
let MAX_RAM_SIZE = 128*1024;
let ram_size = 128 * 1024;
let sp = RAM_ADDRESS + ram_size;
let INSTRUCTIONS_COUNT = 0;

//Registers
let REGISTER_START = 0xe0000000;
let REGISTER_END = 0xe0040000;

var d = new cs.Capstone(cs.ARCH_ARM, cs.MODE_THUMB);
var e = new uc.Unicorn(uc.ARCH_ARM, uc.MODE_THUMB);

class UART {
    ADDR = 0x40002000;
    END_ADDR = 0x40002004;

    in_range(address) {
        if(address >= this.ADDR && address <= this.END_ADDR) {
            return true;
        }
        return false;
    }

    read(address) {
        console.log("..");
    }

    write(address, value) {
        console.log("write uart");
    }
};

class NVIC {
    BASE_ADDR = 0xe000e000;
    ICTR_ADDR = this.BASE_ADDR + 0x4;
    ICER_ADDR = this.BASE_ADDR + 0x180;
    ICPR_ADDR = this.BASE_ADDR + 0x280;
    ISER_ADDR = this.BASE_ADDR + 0x100;
    ISPR_ADDR = this.BASE_ADDR + 0x200;

    interrupts = 16;

    enable_interrupts = [ ];
    pending_interrupts = [ ];

    in_range(address) {
        if (address >= 0xe000e000 && address <= 0xe000e7f0) {
            return true;
        }
        return false;
    } 

    write(address, value) {
        if (address >= this.ICER_ADDR && address < this.ICER_ADDR + (((this.interrupts / 32) >>> 0) + 1)) {
            let offset = (address - this.ICER_ADDR) / 4;
            let current_interrupt = 0;
            while (value !== 0) {
                if (value & 0x1 === 1) {
                    let interrupt = offset * 32 + current_interrupt;
                    //console.log(`Clear enable interrupt ${interrupt}`);
                    this.enable_interrupts[interrupt] = false;
                }
                current_interrupt++;
                value = value >>> 1;
            }
        } else if(address >= this.ICPR_ADDR && address < this.ICPR_ADDR + (((this.interrupts / 32) >>> 0) + 1)) {
            let offset = (address - this.ICPR_ADDR) / 4;
            let current_interrupt = 0;
            while (value !== 0) {
                if (value & 0x1 === 1) {
                    let interrupt = offset * 32 + current_interrupt;
                    //console.log(`Clear pending interrupt ${interrupt}`);
                    this.pending_interrupts[interrupt] = false;
                }
                current_interrupt++;
                value = value >>> 1;
            } 
        } else if(address >= this.ISER_ADDR && address < this.ISER_ADDR + (((this.interrupts / 32) >>> 0) + 1)) {
            let offset = (address - this.ISER_ADDR) / 4;
            let current_interrupt = 0;
            while(value !== 0) {
                if (value & 0x1 === 1) {
                    let interrupt = offset * 32 + current_interrupt;
                    //console.log(`Set enable interrupt ${interrupt}`);
                    this.enable_interrupts[interrupt] = true;
                }
                current_interrupt++;
                value = value >>> 1;
            }
        } else if(address >= this.ISPR_ADDR && address < this.ISPR_ADDR + (((this.interrupts / 32) >>> 0) + 1)) {
            let offset = (address - this.ISPR_ADDR) / 4;
            let current_interrupt = 0;
            while(value !== 0) {
                if (value & 0x1 === 1) {
                    let interrupt = offset * 32 + current_interrupt;
                    //console.log(`Set pending interrupt ${interrupt}`);
                    this.pending_interrupts[interrupt] = true;
                }
                current_interrupt++;
                value = value >>> 1;
            }
        }
    }

    // TODO: Set for enable and disable, clear for enable 

    read(address) {
        if (address = this.ICTR_ADDR) {
            e.mem_write(address, Buffer.from([(this.interrupts / 32)>>>0]))
        }
    }
}

let nvic = new NVIC();
let uart = new UART();

// Instruction Pointer
function pcRead() {
    // console.log('Reading PC: ' + e.reg_read_i32(uc.ARM_REG_PC));
    return e.reg_read_i32(uc.ARM_REG_PC);
}
function pcWrite(value) {
    console.log('Writing PC: ' + e.reg_write_i32(uc.ARM_REG_PC, value));
    return e.reg_write_i32(uc.ARM_REG_PC, value);
}

function read_fn (handle, type, addr_lo, addr_hi, size, value_lo, value_hi, user_data) {
    let address = addr_lo >>> 0;
    if (nvic.in_range(address)) {
        nvic.read(address);
    } else if (uart.in_range(address)) {
        uart.read(address);
    }
    // if((addr_lo>>>0) === 0xe000e004) {
    //     console.log('Trying to write to 0xe000e004: ');
    //     console.log(Buffer.from([(nvic.interrupts / 32)>>>0]));
    //     e.mem_write(0xe000e004, Buffer.from([(nvic.interrupts / 32)>>>0]));
    //     console.log(`ICTR: type: ${type}, addr_hi: ${addr_hi}, size: ${size}, value_lo: ${value_lo}, value_hi: ${value_hi}, user_data: ${user_data}`);
    // }
//     console.log (`mem read 0x${(addr_lo>>>0).toString(16)}`); 
//     console.log('Mem read: at ' + pcRead().toString(16));
//     let mem = e.mem_read (pcRead(), 2);
//     try {
//         let disasm = d.disasm (mem, 0);
   
//         if (disasm[0])
//         {
//             console.log (" -> " + disasm[0].mnemonic + " " + disasm[0].op_str);
//         }
//     } catch (e) {
//         console.log(e);
//     }
};


function write_fn (handle, type, addr_lo, addr_hi, size, value_lo, value_hi, user_data) {
    // console.log (`mem write 0x${(addr_lo>>>0).toString(16)} -> 0x${(value_lo>>>0).toString(16)}`); 
    let address = addr_lo >>> 0;
    let value = value_lo >>> 0;
    if (nvic.in_range(address)) {
        nvic.write(address, value);
    } else if (uart.in_range(address)) {
        uart.write(address, value);
    }
}

function read_unmapped_fn (handle, type, addr_lo, addr_hi, size, value_lo, value_hi, user_data) {
    console.log (`mem read unmapppped 0x${(addr_lo>>>0).toString(16)}`); 
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

// function read_register(handle, type, addr_lo, addr_hi, size, value_lo, value_hi, user_data) {
//     //console.log("Read");
//     console.log(`Read Register Address: ${(addr_lo>>>0).toString(16)}`);
// }

// function write_register(handle, type, addr_lo, addr_hi, size, value_lo, value_hi, user_data) {
//     //console.log("Write");
//     console.log(`Write Register Address: ${(addr_lo>>>0).toString(16)}. ${(value_lo>>>0).toString(16)}`);
// }

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

    //e.hook_add (uc.HOOK_MEM_WRITE, write_fn, 0, RAM_ADDRESS, RAM_ADDRESS+MAX_RAM_SIZE, 0);
    //e.hook_add (uc.HOOK_MEM_READ, read_fn, 0, RAM_ADDRESS, RAM_ADDRESS+MAX_RAM_SIZE, 0);
    // e.hook_add (uc.HOOK_MEM_READ_UNMAPPED, read_unmapped_fn);
    // e.hook_add (uc.HOOK_MEM_WRITE_UNMAPPED, write_unmapped_fn);
    // e.hook_add (uc.HOOK_INTR, interrupt_fn);

    //Map registers and hook em
    e.mem_map(REGISTER_START, REGISTER_END - REGISTER_START, uc.PROT_ALL);
    e.hook_add(uc.HOOK_MEM_READ, read_fn, 0, REGISTER_START, REGISTER_END - REGISTER_START);
    e.hook_add(uc.HOOK_MEM_WRITE, write_fn, 0, REGISTER_START, REGISTER_END - REGISTER_START);

    e.mem_write(FLASH_ADDRESS, firmware);

    function execution () {

        
        let pc = pcRead ();
        let mem = e.mem_read (pc, 2);
        try
        {
        let disasm = d.disasm (mem, 0);
            if (disasm[0]) {
                // console.log ("(from execution) executing " + pc.toString (16) + " -> " + disasm[0].mnemonic + " " + disasm[0].op_str);
                process.stdout.write(pc.toString (16) + " -> " + disasm[0].mnemonic + " " + disasm[0].op_str + '\r');
            }
            // lpc = pcRead ();
            // mem = e.mem_read (pc, 2);
            // disasm = d.disasm (mem, 0);
            // console.log ("executing " + pc.toString (16) + " -> " + disasm[0].mnemonic + " " + disasm[0].op_str);
            //setTimeout (execution, 0);
            // requestAnimationFrame(execution);
        }
        catch (err) {
            // let pc = pcRead ();
            // let mem = e.mem_read (pc, 2);
            // let disasm = d.disasm (mem, 0);
            // console.log ("executing " + pc.toString (16) + " -> " + disasm[0].mnemonic + " " + disasm[0].op_str);
        }
        e.emu_start(pc | 1, FLASH_ADDRESS+FLASH_SIZE, 0, 1);

    }

    while (1) { 
        execution ();
    }
}

function loadFirmware() {
    firmware = new Uint8Array(fs.readFileSync('./express/unicorn_board.bin'));
    return firmware;
}