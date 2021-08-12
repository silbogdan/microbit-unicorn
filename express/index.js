const app = require('express')();
const path = require('path');
const fs = require('fs');
const PORT = 8080;

var file = fs.readFileSync('./microbit_v2.bin');
console.log(file);

app.get('/', (req, res) => {
    res.status(200).json({file: file});
});

app.listen(PORT, () => {
    console.log("Listening at port " + PORT);
});