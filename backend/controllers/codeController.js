const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Run user code
exports.runCode = (req, res) => {
  const { code, language } = req.body;

  // Determine file extension based on language
  let fileExtension;
  let compileCommand;
  let runCommand;

  switch (language) {
    case 'python':
      fileExtension = 'py';
      runCommand = (filePath) => `python ${filePath}`;
      break;
    case 'javascript':
      fileExtension = 'js';
      runCommand = (filePath) => `node ${filePath}`;
      break;
    case 'c':
      fileExtension = 'c';
      compileCommand = (filePath) => `gcc ${filePath} -o tempCode.out`;
      runCommand = './tempCode.out';
      break;
    case 'cpp':
      fileExtension = 'cpp';
      compileCommand = (filePath) => `g++ ${filePath} -o tempCode.out`;
      runCommand = './tempCode.out';
      break;
    case 'bash':
      fileExtension = 'sh';
      runCommand = (filePath) => `bash ${filePath}`;
      break;
    default:
      return res.status(400).json({ error: 'Unsupported language' });
  }

  const fileName = `tempCode.${fileExtension}`;
  const filePath = path.join(__dirname, fileName);

  // Save the code to a temporary file
  fs.writeFile(filePath, code, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Error writing code to file' });
    }

    // If C or C++, compile the code first
    if (compileCommand) {
      exec(compileCommand(filePath), { timeout: 5000 }, (compileError, stdout, stderr) => {
        if (compileError) {
          return res.status(500).json({ output: stderr || 'Compilation error' });
        }

        // After successful compilation, run the compiled program
        exec(runCommand, { timeout: 5000 }, (runError, runStdout, runStderr) => {
          cleanupTempFiles();
          if (runError) {
            if (runError.killed) {
              return res.status(500).json({ output: 'Execution timeout' });
            }
            return res.status(500).json({ output: runStderr || 'Execution error' });
          }
          res.json({ output: runStdout });
        });
      });
    } else {
      // Execute non-compiled languages (Python, JavaScript, Bash)
      exec(runCommand(filePath), { timeout: 5000 }, (error, stdout, stderr) => {
        cleanupTempFiles();
        if (error) {
          if (error.killed) {
            return res.status(500).json({ output: 'Execution timeout' });
          }
          return res.status(500).json({ output: stderr || 'Execution error' });
        }
        res.json({ output: stdout });
      });
    }
  });

  // Clean up temporary files
  const cleanupTempFiles = () => {
    fs.unlink(filePath, (unlinkErr) => {
      if (unlinkErr) console.error('Error deleting file:', unlinkErr);
    });
    if (language === 'c' || language === 'cpp') {
      fs.unlink(path.join(__dirname, 'tempCode.out'), (unlinkErr) => {
        if (unlinkErr) console.error('Error deleting compiled file:', unlinkErr);
      });
    }
  };
};
