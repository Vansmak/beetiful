window.onload = function() {
    getStats();              // Fetch and display stats
    viewConfig();            // Load and display config data
    
    setupCommandDropdown();  // Setup the command dropdown
};

function getStats() {
    fetch('/api/stats')
        .then(response => response.json())
        .then(data => {
            // Update stats in the table headers
            document.getElementById('totalTracks').textContent = data.total_tracks !== undefined ? `(${data.total_tracks})` : '';
            document.getElementById('totalArtists').textContent = data.total_artists !== undefined ? `(${data.total_artists})` : '';
            document.getElementById('totalAlbums').textContent = data.total_albums !== undefined ? `(${data.total_albums})` : '';
        })
        .catch(error => {
            console.error('Error loading stats:', error);
        });
}

// Function to setup the command dropdown
function setupCommandDropdown() {
    const commandDropdown = document.getElementById('command');
    commandDropdown.innerHTML = `
        <option value="">Choose Command</option>
        <option value="import">Import</option>
        <option value="update">Update</option>
        <option value="list">List</option>
        <option value="modify">Modify</option>
        <option value="config">Config</option>
    `;
    commandDropdown.addEventListener('change', updateCommandOptions);
}



function updateCommandOptions() {
    const command = document.getElementById('command').value;
    const optionsDiv = document.getElementById('command-options');
    optionsDiv.innerHTML = '';
    let commandPreview = `beet ${command}`;

    switch (command) {
        case 'import':
            optionsDiv.innerHTML = `
                <h3>Import Options</h3>
                <label><input type="checkbox" value="-A" onchange="updatePreview()"> Don’t autotag; just import</label><br>
                <label><input type="checkbox" value="-W" onchange="updatePreview()"> Don’t write new tags to files</label><br>
                <label><input type="checkbox" value="-C" onchange="updatePreview()"> Don’t copy imported files; leave them where they are</label><br>
                <label><input type="checkbox" value="-m" onchange="updatePreview()"> Move imported files to your music directory</label><br>
                <label><input type="text" id="importPath" placeholder="Enter path to music folder or track" oninput="updatePreview()"></label><br>
                <label><input type="text" id="importLog" placeholder="Logfile path for skipped albums (optional)" oninput="updatePreview()"></label><br>
                <label><input type="text" id="additionalImportArgs" placeholder="Additional arguments (e.g., specific track names)" oninput="updatePreview()"></label><br>
            `;
            break;
        case 'update':
            optionsDiv.innerHTML = `
                <h3>Update Options</h3>
                <label><input type="text" id="fields" placeholder="Fields to update (-F)" oninput="updatePreview()"></label><br>
                <label><input type="text" id="excludeFields" placeholder="Exclude fields (-e)" oninput="updatePreview()"></label><br>
                <label><input type="checkbox" value="-a" onchange="updatePreview()"> Operate on albums</label><br>
                <label><input type="checkbox" value="-M" onchange="updatePreview()"> Disable renaming files</label><br>
                <label><input type="checkbox" value="-p" onchange="updatePreview()"> Dry run (pretend)</label><br>
                <label><input type="text" id="updateQuery" placeholder="Enter query" oninput="updatePreview()"></label><br>
            `;
            break;
        case 'list':
            optionsDiv.innerHTML = `
                <h3>List Options</h3>
                <label><input type="checkbox" value="-a" onchange="updatePreview()"> Search for albums</label><br>
                <label><input type="checkbox" value="-p" onchange="updatePreview()"> Print filenames of matched items</label><br>
                <label><input type="text" id="listFormat" placeholder="Format (-f)" oninput="updatePreview()"></label><br>
                <label><input type="text" id="listQuery" placeholder="Enter query like artist:name" oninput="updatePreview()"></label><br>
            `;
            break;
        case 'modify':
            optionsDiv.innerHTML = `
                <h3>Modify Options</h3>
                <label><input type="text" id="modifyFields" placeholder="FIELD=VALUE pairs" oninput="updatePreview()"></label><br>
                <label><input type="checkbox" value="-I" onchange="updatePreview()"> Prevent cascading changes to tracks</label><br>
                <label><input type="checkbox" value="-M" onchange="updatePreview()"> Prevent moving items</label><br>
                <label><input type="checkbox" value="-W" onchange="updatePreview()"> Don’t write tags to files</label><br>
                <label><input type="checkbox" value="-a" onchange="updatePreview()"> Modify album fields</label><br>
                <label><input type="checkbox" value="-y" onchange="updatePreview()"> Automatically confirm changes</label><br>
                <label><input type="text" id="modifyQuery" placeholder="Enter query" oninput="updatePreview()"></label><br>
            `;
            break;
        case 'config':
            optionsDiv.innerHTML = `
                <h3>Config Options</h3>
                <label><input type="checkbox" value="-d" onchange="updatePreview()"> Include default options</label><br>
                <label><input type="checkbox" value="-p" onchange="updatePreview()"> Show path to configuration file</label><br>
                <label><input type="checkbox" value="-c" onchange="updatePreview()"> Include sensitive data</label><br>
                <label><input type="checkbox" value="-e" onchange="updatePreview()"> Edit configuration file</label><br>
            `;
            viewConfig(); // Load config details if the command is 'config'
            break;
        default:
            optionsDiv.innerHTML = '<p>Select a command to see options.</p>';
    }

    document.getElementById('commandPreview').textContent = commandPreview;
}

function updatePreview() {
    const command = document.getElementById('command').value;
    let commandPreview = `beet ${command}`;
    const options = Array.from(document.querySelectorAll('#command-options input[type="checkbox"]:checked')).map(el => el.value);
    const fields = document.getElementById('fields')?.value || '';
    const excludeFields = document.getElementById('excludeFields')?.value || '';
    const importPath = document.getElementById('importPath')?.value || '';
    const importLog = document.getElementById('importLog')?.value || '';
    const additionalImportArgs = document.getElementById('additionalImportArgs')?.value || '';
    const updateQuery = document.getElementById('updateQuery')?.value || '';
    const listFormat = document.getElementById('listFormat')?.value || '';
    const listQuery = document.getElementById('listQuery')?.value || '';
    const modifyFields = document.getElementById('modifyFields')?.value || '';
    const modifyQuery = document.getElementById('modifyQuery')?.value || '';

    if (fields) commandPreview += ` -F ${fields}`;
    if (excludeFields) commandPreview += ` -e ${excludeFields}`;
    if (importPath) commandPreview += ` ${importPath}`;
    if (importLog) commandPreview += ` -l ${importLog}`;
    if (additionalImportArgs) commandPreview += ` ${additionalImportArgs}`;
    if (updateQuery) commandPreview += ` ${updateQuery}`;
    if (listFormat) commandPreview += ` -f ${listFormat}`;
    if (listQuery) commandPreview += ` ${listQuery}`;
    if (modifyFields) commandPreview += ` ${modifyFields}`;
    if (modifyQuery) commandPreview += ` ${modifyQuery}`;
    if (options.length > 0) commandPreview += ` ${options.join(' ')}`;

    document.getElementById('commandPreview').textContent = commandPreview;
}

function runCommand() {
    const command = document.getElementById('command').value;
    const options = Array.from(document.querySelectorAll('#command-options input[type="checkbox"]:checked')).map(el => el.value);
    const fields = document.getElementById('fields')?.value || '';
    const excludeFields = document.getElementById('excludeFields')?.value || '';
    const importPath = document.getElementById('importPath')?.value || '';
    const importLog = document.getElementById('importLog')?.value || '';
    const additionalImportArgs = document.getElementById('additionalImportArgs')?.value || '';
    const updateQuery = document.getElementById('updateQuery')?.value || '';
    const listFormat = document.getElementById('listFormat')?.value || '';
    const listQuery = document.getElementById('listQuery')?.value || '';
    const modifyFields = document.getElementById('modifyFields')?.value || '';
    const modifyQuery = document.getElementById('modifyQuery')?.value || '';

    let args = [];
    if (fields) options.push(`-F ${fields}`);
    if (excludeFields) options.push(`-e ${excludeFields}`);
    if (importPath) args.push(importPath);
    if (importLog) options.push(`-l ${importLog}`);
    if (additionalImportArgs) args.push(additionalImportArgs);
    if (updateQuery) args.push(updateQuery);
    if (listFormat) options.push(`-f ${listFormat}`);
    if (listQuery) args.push(listQuery);
    if (modifyFields) args.push(modifyFields);
    if (modifyQuery) args.push(modifyQuery);

    fetch('/api/run-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, options, arguments: args })
    })
    .then(response => response.json())
    .then(data => {
        if (command === 'list') {
            window.location.href = '/library.html';
        } else {
            document.getElementById('commandResult').textContent = formatCommandOutput(data.output || JSON.stringify(data, null, 2));
        }

        if (command === 'config') {
            viewConfig();
        }
    });
}

function formatCommandOutput(output) {
    if (typeof output === 'string') {
        return output.split('\n').map(line => line.trim()).join('\n');
    }
    return output;
}




// static/js/scripts.js


function viewConfig() {
    fetch('/api/config')
        .then(response => response.text())  // Fetch as plain text
        .then(data => {
            document.getElementById('configTextArea').value = data;  // Populate the textarea with raw YAML
        })
        .catch(error => {
            document.getElementById('configResult').textContent = 'Error loading config: ' + error.message;
        });
}

function editConfig() {
    const yamlText = document.getElementById('configTextArea').value;  // Get raw text from textarea

    fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },  // Send plain text
        body: yamlText  // Send raw text
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('configResult').textContent = data.message || 'Config saved successfully.';
    })
    .catch(error => {
        document.getElementById('configResult').textContent = 'Error saving config: ' + error.message;
    });
}


