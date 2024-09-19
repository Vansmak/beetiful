from flask import Flask, jsonify, request, render_template
import os
import subprocess
from dotenv import load_dotenv


load_dotenv()

app = Flask(__name__)

beets_config_dir = os.getenv('BEETSDIR', os.path.expanduser('~/.config/beets'))
config_path = os.path.join(beets_config_dir, 'config.yaml')


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

@app.route('/api/config', methods=['POST'])
def edit_config():
    """Save the configuration as raw text."""
    try:
        config_text = request.data.decode('utf-8')  
        with open(config_path, 'w') as file:
            file.write(config_text)  
        return jsonify({'message': 'Configuration updated successfully'}), 200
    except Exception as e:
        return jsonify({'error': f"Failed to save configuration: {str(e)}"}), 500

@app.route('/')
def home():
    return render_template('index.html')


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
    result = subprocess.run(['beet', 'list', '-f', '$title@@$artist@@$album@@$genre@@$year@@$bpm@@$composer@@$comments'], capture_output=True, text=True)
    if result.returncode == 0:
        items = [parse_library_item(line) for line in result.stdout.splitlines()]
        return jsonify({'items': items})
    else:
        return jsonify({'error': result.stderr}), 500

def parse_library_item(line):
    """Parse a library item from the list output."""
    fields = line.split('@@')  
    return {
        'title': fields[0] if len(fields) > 0 else '',
        'artist': fields[1] if len(fields) > 1 else '',
        'album': fields[2] if len(fields) > 2 else '',
        'genre': fields[3] if len(fields) > 3 else '',
        'year': fields[4] if len(fields) > 4 else '',
        'bpm': fields[5] if len(fields) > 5 else '',
        'composer': fields[6] if len(fields) > 6 else '',
        'comments': fields[7] if len(fields) > 7 else ''
    }


        
@app.route('/api/library/remove', methods=['POST'])
def remove_track():
    data = request.json
    title = data.get('title')
    artist = data.get('artist')
    album = data.get('album')

    
    id_command = ['beet', 'list', '-f', '$id', f'title:{title}', f'artist:{artist}', f'album:{album}']
    id_result = subprocess.run(id_command, capture_output=True, text=True)

    if id_result.returncode != 0 or not id_result.stdout.strip():
        print(f"Error finding track ID: {id_result.stderr}")
        return jsonify({'error': 'Track not found for removal.'}), 500

    track_id = id_result.stdout.strip()
    print(f"Found track ID: {track_id}")

    
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
    print(f"Delete request received with data: {data}")  
    title = data.get('title')
    artist = data.get('artist')
    album = data.get('album')

    if not title or not artist or not album:
        print("Error: Missing required fields for delete command.")  
        return jsonify({'error': 'Missing required fields'}), 400

    
    command = ['beet', 'remove', '-f', f'title:{title}', f'artist:{artist}', f'album:{album}']
    print(f"Executing delete command: {' '.join(command)}") 

    try:
        result = subprocess.run(command, capture_output=True, text=True, check=True)
        print("Track deleted successfully.")  
        return jsonify({'message': 'Track removed from library.'})
    except subprocess.CalledProcessError as e:
        print(f"Error deleting track: {e.stderr}")  
        return jsonify({'error': e.stderr}), 500




@app.route('/api/library/update', methods=['POST'])
def update_track():
    data = request.json
    original_title = data.get('originalTitle', '')
    original_artist = data.get('originalArtist', '')
    original_album = data.get('originalAlbum', '')
    updated_track = data.get('updatedTrack', {})

    
    command = ['beet', 'modify', '-y', f'title:{original_title}', f'artist:{original_artist}', f'album:{original_album}']

    
    for field, value in updated_track.items():
        if value:  
            command.append(f'{field}={value}')

    
    print(f"Executing command: {' '.join(command)}")

    
    result = subprocess.run(command, capture_output=True, text=True)

    
    if result.returncode != 0:
        print(f"Error: {result.stderr}")
        return jsonify({'error': result.stderr}), 500

    return jsonify({'message': 'Track updated successfully.'})


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
            stats['total_size'] = line.split(': ')[1].split(' ')[0]  
    return stats

# Read port from environment variable, defaulting to 3000 if not set
port = int(os.getenv("FLASK_PORT", 3000))

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=port)

