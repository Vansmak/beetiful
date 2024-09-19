from flask import Flask, jsonify, request, render_template
import os
import shlex
import yaml
import json
import subprocess
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)

# Use the environment variable or fallback to default paths
beets_config_dir = os.getenv('BEETSDIR', os.path.expanduser('~/.config/beets'))
config_path = os.path.join(beets_config_dir, 'config.yaml')


# Load the config as raw YAML text
@app.route('/api/config', methods=['GET'])
def view_config():
    """Fetch the configuration as raw text."""
    try:
        with open(config_path, 'r') as file:
            config_text = file.read()
        return config_text, 200
    except FileNotFoundError:
        return "Config file not found.", 404
    except Exception as e:
        return f"Error loading config: {str(e)}", 500

# Save the config as raw YAML text
@app.route('/api/config', methods=['POST'])
def edit_config():
    """Save the configuration as raw text."""
    try:
        config_text = request.data.decode('utf-8')  # Get the raw YAML text from the request
        with open(config_path, 'w') as file:
            file.write(config_text)  # Write the raw text back to the file
        return jsonify({'message': 'Configuration updated successfully'}), 200
    except Exception as e:
        return jsonify({'error': f"Failed to save configuration: {str(e)}"}), 500
# Routes for the main pages
@app.route('/')
def home():
    return render_template('index.html')



# API Endpoints
@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Fetch statistics from beets."""
    result = subprocess.run(['beet', 'stats'], capture_output=True, text=True)
    if result.returncode == 0:
        stats = parse_stats(result.stdout)
        return jsonify(stats)
    else:
        return jsonify({'error': result.stderr}), 500



@app.route('/api/run-command', methods=['POST'])
def run_command():
    """Run a command using beets."""
    command = request.json.get('command')
    options = request.json.get('options', [])
    arguments = request.json.get('arguments', [])

    full_command = ['beet', command] + options + arguments

    try:
        result = subprocess.run(full_command, capture_output=True, text=True)
        if result.returncode == 0:
            return jsonify({'output': result.stdout.splitlines()})
        else:
            return jsonify({'error': result.stderr}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/library', methods=['GET'])
def get_library():
    """Fetch the library items including genre information."""
    # Adjust the format to match the expected four fields: title, artist, album, genre
    result = subprocess.run(['beet', 'list', '-f', '$title@@$artist@@$album@@$genre'], capture_output=True, text=True)
    if result.returncode == 0:
        items = [parse_library_item(line) for line in result.stdout.splitlines()]
        return jsonify({'items': items})
    else:
        return jsonify({'error': result.stderr}), 500

def parse_library_item(line):
    fields = line.split('@@')
    if len(fields) != 4:  # Adjusted to 4 fields instead of 5
        print(f"Warning: Unexpected number of fields in line: {line}")
        return {
            'title': '',
            'artist': '',
            'album': '',
            'genre': ''
        }
    return {
        'title': fields[0].strip() or '',
        'artist': fields[1].strip() or '',
        'album': fields[2].strip() or '',
        'genre': fields[3].strip() or ''
    }


# Add this debugging function
@app.route('/api/debug_library', methods=['GET'])
def debug_library():
    """Debug endpoint to check raw library data."""
    result = subprocess.run(['beet', 'list', '-f', '$title@@$artist@@$album@@$year@@$genre'], capture_output=True, text=True)
    if result.returncode == 0:
        raw_items = result.stdout.splitlines()
        parsed_items = [parse_library_item(line) for line in raw_items]
        return jsonify({
            'raw_items': raw_items,
            'parsed_items': parsed_items
        })
    else:
        return jsonify({'error': result.stderr}), 500
        
@app.route('/api/library/remove', methods=['POST'])
def remove_track():
    data = request.json
    title = data.get('title')
    artist = data.get('artist')
    album = data.get('album')

    # Find the track ID first
    id_command = ['beet', 'list', '-f', '$id', f'title:{title}', f'artist:{artist}', f'album:{album}']
    id_result = subprocess.run(id_command, capture_output=True, text=True)

    if id_result.returncode != 0 or not id_result.stdout.strip():
        print(f"Error finding track ID: {id_result.stderr}")
        return jsonify({'error': 'Track not found for removal.'}), 500

    track_id = id_result.stdout.strip()
    print(f"Found track ID: {track_id}")

    # Construct the remove command using the ID
    remove_command = ['beet', 'remove', '-f', f'id:{track_id}']
    print(f"Executing remove command: {' '.join(remove_command)}")

    try:
        result = subprocess.run(remove_command, capture_output=True, text=True, check=True)
        print("Track removed from library.")
        return jsonify({'message': 'Track removed from library.'})
    except subprocess.CalledProcessError as e:
        print(f"Error removing track: {e.stderr}")
        return jsonify({'error': e.stderr}), 500


@app.route('/api/library/delete', methods=['POST'])
def delete_track():
    data = request.json
    print(f"Delete request received with data: {data}")  # Debug line
    title = data.get('title')
    artist = data.get('artist')
    album = data.get('album')

    if not title or not artist or not album:
        print("Error: Missing required fields for delete command.")  # Debug line
        return jsonify({'error': 'Missing required fields'}), 400

    # Construct the delete command
    command = ['beet', 'remove', '-f', f'title:{title}', f'artist:{artist}', f'album:{album}']
    print(f"Executing delete command: {' '.join(command)}")  # Debug line

    try:
        result = subprocess.run(command, capture_output=True, text=True, check=True)
        print("Track deleted successfully.")  # Debug line
        return jsonify({'message': 'Track removed from library.'})
    except subprocess.CalledProcessError as e:
        print(f"Error deleting track: {e.stderr}")  # Debug line
        return jsonify({'error': e.stderr}), 500




@app.route('/api/library/update', methods=['POST'])
def update_track():
    data = request.json
    original_title = data.get('originalTitle', '')
    original_artist = data.get('originalArtist', '')
    original_album = data.get('originalAlbum', '')
    updated_track = data.get('updatedTrack', {})

    # Construct the base command without extra quotes
    command = ['beet', 'modify', '-y', f'title:{original_title}', f'artist:{original_artist}', f'album:{original_album}']

    # Add fields to the command without quotes around field values
    for field, value in updated_track.items():
        if value:  # Only add fields with values
            command.append(f'{field}={value}')

    # Debugging: Print the constructed command
    print(f"Executing command: {' '.join(command)}")

    # Execute the command
    result = subprocess.run(command, capture_output=True, text=True)

    # Check for errors and print stderr if any
    if result.returncode != 0:
        print(f"Error: {result.stderr}")
        return jsonify({'error': result.stderr}), 500

    return jsonify({'message': 'Track updated successfully.'})



# Plugin Management Endpoints
@app.route('/api/plugins', methods=['GET'])
def get_plugins():
    """Retrieve enabled plugins and their config sections."""
    config = load_config()
    plugins = config.get('plugins', [])
    plugin_details = {plugin: config.get(plugin, {}) for plugin in plugins}
    return jsonify(plugin_details)

@app.route('/api/plugins/enable', methods=['POST'])
def enable_plugin():
    plugin_name = request.json.get('plugin')
    if not plugin_name:
        return jsonify({'error': 'No plugin specified'}), 400

    config = load_config()
    if 'plugins' not in config:
        config['plugins'] = []

    if plugin_name not in config['plugins']:
        config['plugins'].append(plugin_name)
        # Add an empty section for the plugin if it's not already defined
        if plugin_name not in config:
            config[plugin_name] = {}  # Initialize an empty options section

    if save_config(config):
        return jsonify({'message': f'Plugin {plugin_name} enabled'})
    else:
        return jsonify({'error': 'Failed to update configuration'}), 500

@app.route('/api/plugins/disable', methods=['POST'])
def disable_plugin():
    """Disable a plugin by removing it from the plugins list."""
    plugin_name = request.json.get('plugin')
    if not plugin_name:
        return jsonify({'error': 'No plugin specified'}), 400

    config = load_config()
    # Only remove the plugin from the 'plugins' list, not from the config
    if 'plugins' in config and plugin_name in config['plugins']:
        config['plugins'].remove(plugin_name)

    # Save the updated configuration
    if save_config(config):
        return jsonify({'message': f'Plugin {plugin_name} disabled successfully.'})
    else:
        return jsonify({'error': 'Failed to update configuration'}), 500

@app.route('/api/plugin/options', methods=['GET'])
def get_plugin_options():
    plugin_name = request.args.get('plugin')
    if not plugin_name:
        return jsonify({'error': 'No plugin specified'}), 400

    config = load_config()
    plugin_options = config.get(plugin_name, {})

    # Example links for plugin documentation
    plugin_links = {
        'lastgenre': 'https://beets.readthedocs.io/en/stable/plugins/lastgenre.html',
        'lyrics': 'https://beets.readthedocs.io/en/stable/plugins/lyrics.html',
        # Add more plugins as needed
    }

    # Include a helpful link even if no options are defined
    response = {
        'plugin': plugin_name,
        'options': plugin_options,
        'link': plugin_links.get(plugin_name, 'https://beets.readthedocs.io/en/stable/plugins/')
    }

    return jsonify(response)


@app.route('/api/plugin/options', methods=['POST'])
def update_plugin_options():
    """Update options for a specific plugin."""
    plugin_name = request.json.get('plugin')
    options = request.json.get('options', {})
    if not plugin_name:
        return jsonify({'error': 'No plugin specified'}), 400

    config = load_config()
    if plugin_name in config:
        config[plugin_name] = options
        if save_config(config):
            return jsonify({'message': f'Configuration for {plugin_name} updated.'})
        else:
            return jsonify({'error': 'Failed to save configuration'}), 500
    else:
        return jsonify({'error': f'Plugin {plugin_name} not found in configuration'}), 404

# Utility Functions
def parse_stats(output):
    """Parse the stats output from beets."""
    lines = output.splitlines()
    stats = {}
    for line in lines:
        if 'Tracks:' in line:
            stats['total_tracks'] = line.split(': ')[1]
        elif 'Albums:' in line:
            stats['total_albums'] = line.split(': ')[1]
        elif 'Artists:' in line:
            stats['total_artists'] = line.split(': ')[1]
        elif 'Total size:' in line:
            stats['total_size'] = line.split(': ')[1].split(' ')[0]  # Extract size without unit
    return stats

def parse_library_item(line):
    """Parse a library item from the list output."""
    fields = line.split(' | ')  # Adjust delimiter based on your output format
    return {
        'title': fields[0] if len(fields) > 0 else '',
        'artist': fields[1] if len(fields) > 1 else '',
        'album': fields[2] if len(fields) > 2 else '',
        'genre': fields[3] if len(fields) > 3 else ''
    }

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=3001)
