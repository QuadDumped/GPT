const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const app = express();
const port = 3000;

init = false

app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// spawn the Python process once and keep it running
const pythonProcess = spawn('python', ['gpt.py']);

pythonProcess.stdout.on('data', (data) => {
    console.log(`${data.toString()}`);
});

app.post('/run-python', (req, res) => {

    const data = req.body;

    // convert the data to a string and write it to the python process stdin
    pythonProcess.stdin.write(JSON.stringify(data) + '\n');

    let pythonOutput = '';

    // listen for data coming from the python process stdout
    const handleData = (data) => {
        pythonOutput += data.toString();
        // check if the output is complete 
        try {
            const jsonResponse = JSON.parse(pythonOutput);
            res.send(jsonResponse);
            pythonOutput = ''; // reset for the next message
            pythonProcess.stdout.off('data', handleData); // remove the listener after sending the response
        } catch (err) {
            // if the JSON is incomplete, continue to accumulate data
        }
    };

    pythonProcess.stdout.on('data', handleData);

    // handle errors from the python process
    pythonProcess.stderr.on('data', (data) => {
        console.error(`stderr: ${data.toString()}`);
    });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
