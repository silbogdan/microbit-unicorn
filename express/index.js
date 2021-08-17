const app = require('express')();
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const PORT = 8080;

app.use(cors());

var file = fs.readFileSync('./unicorn_board.bin');
console.log(file);

app.get('/', (req, res) => {
    res.status(200).json({file: file});
});

app.listen(PORT, () => {
    console.log("Listening at port " + PORT);
});