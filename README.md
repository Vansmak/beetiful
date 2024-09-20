# Beetiful

<img src="https://github.com/user-attachments/assets/7a8eabb9-bfc4-4f40-a07c-382d382e64f7" width="200" height="200">

Beetiful is a simple yet elegant web-based interface for managing your music library using [beets](https://beets.io/). It allows you to manage and interact with your music library through an intuitive GUI, while leveraging the power of beets on the backend.
## Support This Project

If you find this project helpful, please consider supporting it. Your contributions help maintain and improve the project. Any support is greatly appreciated! ❤️

[![Buy Me A Coffee](https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=&slug=your_Vansmak&button_colour=FFDD00&font_colour=000000&font_family=Comic&outline_colour=000000&coffee_colour=ffffff)](https://www.buymeacoffee.com/your_username)
  
Thank you for your support!

## Features

- Command Builder for running Beets commands
- Config Editor to edit the `beets` configuration file directly from the interface
- Music Library Viewer with filtering, sorting, and pagination
- Simple integration with beets' advanced music management features

## Future additions
- Docker
- Plugin manager
- More commands
- Mobile friendly layout
## Installation

To install Beetiful, follow these steps:

1. **Clone the Repository**

    ```bash
    git clone https://github.com/Vansmak/beetiful.git
    cd beetiful
    ```

2. **Create a Virtual Environment**

    It's recommended to use a Python virtual environment to keep your dependencies isolated.

    ```bash
    python3 -m venv venv
    source venv/bin/activate
    ```

3. **Install Dependencies**

    Install the required Python packages:

    ```bash
    pip install -r requirements.txt
    ```
4. ## Environment Variables

Create a `.env` file in the project root to configure Beets-specific settings. Here's an example:

    ```
    # .env file

    # Path to the user's Beets configuration directory
    BEETSDIR=/.config/beets

    # Path to your music library
    LIBRARY_PATH=/music

    # Add any other environment-specific settings here
    PORT=
    ```
5. **Running the Application

To start the application, you can run the following command from the project root:

```bash
python app.py

```
    Open your browser and navigate to `http://127.0.0.1:3001`.

## Usage

- **Command Builder**: Execute standard Beets commands like `import`, `list`, `update`, `modify`, and more. Build commands interactively through the UI.
- **Library Management**: View your library with sorting and filtering options. Use the pagination buttons to navigate large libraries.
- **Config Editor**: Edit the Beets configuration directly from the web interface. The `save` button will update the `config.yaml` file.


![Unified Music Management](https://github.com/user-attachments/assets/4bc8887a-aee5-4450-a7f1-799c4eaf8c86)

