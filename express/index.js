const app = require('express')();
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const PORT = 8080;

app.use(cors());

app.get('/', (req, res) => {
    let file = fs.readFileSync('./microbit_v2.bin');
    console.log(file);
    res.status(200).json({file: file});
});

app.listen(PORT, () => {
    console.log("Listening at port " + PORT);
});