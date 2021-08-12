let FLASH_ADDRESS = 0x00000000;
let FLASH_SIZE =  0x80000;
let RAM_ADDRESS = 0x20000000;
let MAX_RAM_SIZE = 0x20000;
let ram_size = 128 * 1024;
let sp = RAM_ADDRESS + ram_size;

var e = new uc.Unicorn(uc.ARCH_ARM, uc.MODE_ARM);

// Instruction Pointer
function pcRead() {
    console.log('Reading PC: ' + e.reg_read_i32(uc.ARM_REG_PC));
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

// Initialize MicroBIT binary
//e.mem_map(FLASH_ADDRESS, FLASH_SIZE, uc.PROT_ALL);
//e.mem_map(RAM_ADDRESS, MAX_RAM_SIZE, uc.PROT_ALL);
main();
async function main() {
    let firmware = await loadFirmware();
    
        e.mem_map(FLASH_ADDRESS, FLASH_SIZE, uc.PROT_ALL);
        e.mem_map(RAM_ADDRESS, MAX_RAM_SIZE, uc.PROT_ALL);
        e.mem_write(FLASH_ADDRESS, firmware);
        e.mem_write(FLASH_ADDRESS, int_to_bytes(sp));
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

//e.mem_write(FLASH_ADDRESS, firmware);
//e.mem_write(FLASH_ADDRESS, int_to_bytes(sp));