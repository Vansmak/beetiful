document.addEventListener('DOMContentLoaded', () => {
    fetchLibrary();
    debugLibrary();
    
    
    
});

let currentPage = 1;
const itemsPerPage = 20;
let libraryData = [];
let filteredData = [];
let sortOrder = { column: null, direction: 'asc' };

function fetchLibrary() {
    fetch('/api/library')
        .then(response => response.json())
        .then(data => {
            if (Array.isArray(data.items)) {
                libraryData = data.items; 
                filteredData = libraryData; 
                showPage(currentPage);    
            } else {
                console.error('Unexpected data format:', data);
                document.getElementById('libraryResults').innerHTML = '<tr><td colspan="5">No library data found.</td></tr>';
            }
        })
        .catch(error => {
            console.error('Error fetching library data:', error);
            document.getElementById('libraryResults').innerHTML = '<tr><td colspan="5">Error loading library data.</td></tr>';
        });
}


function showPage(page) {
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const itemsToDisplay = filteredData.slice(start, end);

    populateLibrary(itemsToDisplay);
    updatePaginationControls();
}


function applyFilters() {
    const filterTitle = document.getElementById('filterTitle').value.toLowerCase();
    const filterArtist = document.getElementById('filterArtist').value.toLowerCase();
    const filterAlbum = document.getElementById('filterAlbum').value.toLowerCase();
    const filterGenre = document.getElementById('filterGenre').value.toLowerCase();

    filteredData = libraryData.filter(item => {
        return (
            (!filterTitle || item.title.toLowerCase().includes(filterTitle)) &&
            (!filterArtist || item.artist.toLowerCase().includes(filterArtist)) &&
            (!filterAlbum || item.album.toLowerCase().includes(filterAlbum)) &&
            (!filterGenre || item.genre.toLowerCase().includes(filterGenre))
        );
    });

    
    document.querySelectorAll('th').forEach(th => th.classList.remove('asc', 'desc'));
    sortOrder = { column: null, direction: 'asc' };

    currentPage = 1; 
    showPage(currentPage);
}

function clearFilters() {
    
    document.getElementById('filterTitle').value = '';
    document.getElementById('filterArtist').value = '';
    document.getElementById('filterAlbum').value = '';
    document.getElementById('filterGenre').value = '';

    
    applyFilters();
}



document.querySelectorAll('.filter-input').forEach(input => {
    input.addEventListener('input', () => {
        applyFilters();
    });
});
function sortByColumn(column) {
    
    document.querySelectorAll('#tableHeaders th').forEach(th => {
        th.classList.remove('asc', 'desc');
        th.querySelector('.sort-arrow')?.remove(); 
    });

    
    if (sortOrder.column === column) {
        sortOrder.direction = sortOrder.direction === 'asc' ? 'desc' : 'asc';
    } else {
        sortOrder.column = column;
        sortOrder.direction = 'asc';
    }

    
    filteredData.sort((a, b) => {
        const aValue = Object.values(a)[column]?.toLowerCase() || '';
        const bValue = Object.values(b)[column]?.toLowerCase() || '';

        if (aValue < bValue) return sortOrder.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortOrder.direction === 'asc' ? 1 : -1;
        return 0;
    });

    
    const header = document.querySelector(`#tableHeaders th[data-column="${column}"]`);
    header.classList.add(sortOrder.direction); 
    const arrow = document.createElement('span');
    arrow.className = 'sort-arrow';
    arrow.innerHTML = sortOrder.direction === 'asc' ? '▲' : '▼';
    header.appendChild(arrow);

    showPage(currentPage); 
}



function clearFilters() {
    document.getElementById('filterTitle').value = '';
    document.getElementById('filterArtist').value = '';
    document.getElementById('filterAlbum').value = '';
    document.getElementById('filterGenre').value = '';

    
    filteredData = libraryData;
    currentPage = 1;

    
    document.querySelectorAll('th').forEach(th => th.classList.remove('asc', 'desc'));
    sortOrder = { column: null, direction: 'asc' };

    showPage(currentPage);
}




function updatePaginationControls() {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginationControls = document.getElementById('paginationControls');
    paginationControls.innerHTML = '';

    const firstButton = document.createElement('button');
    firstButton.innerText = 'First';
    firstButton.disabled = currentPage === 1;
    firstButton.onclick = () => {
        currentPage = 1;
        showPage(currentPage);
    };
    paginationControls.appendChild(firstButton);

    const prevButton = document.createElement('button');
    prevButton.innerText = 'Previous';
    prevButton.disabled = currentPage === 1;
    prevButton.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            showPage(currentPage);
        }
    };
    paginationControls.appendChild(prevButton);

    
    const maxButtons = 5;
    const startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    const endPage = Math.min(totalPages, startPage + maxButtons - 1);

    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.innerText = i;
        pageButton.disabled = i === currentPage;
        pageButton.classList.toggle('active-page', i === currentPage); 
        pageButton.onclick = () => {
            currentPage = i;
            showPage(currentPage);
        };
        paginationControls.appendChild(pageButton);
    }

    const nextButton = document.createElement('button');
    nextButton.innerText = 'Next';
    nextButton.disabled = currentPage === totalPages;
    nextButton.onclick = () => {
        if (currentPage < totalPages) {
            currentPage++;
            showPage(currentPage);
        }
    };
    paginationControls.appendChild(nextButton);

    const lastButton = document.createElement('button');
    lastButton.innerText = 'Last';
    lastButton.disabled = currentPage === totalPages;
    lastButton.onclick = () => {
        currentPage = totalPages;
        showPage(currentPage);
    };
    paginationControls.appendChild(lastButton);

    const pageInfo = document.createElement('span');
    pageInfo.innerText = ` Page ${currentPage} of ${totalPages} `;
    paginationControls.appendChild(pageInfo);
}




document.getElementById('tableHeaders').addEventListener('click', (event) => {
    const column = event.target.dataset.column;
    if (column !== undefined) {
        sortByColumn(parseInt(column));
    }
});
function populateLibrary(items) {
    const libraryResults = document.getElementById('libraryResults');
    libraryResults.innerHTML = '';  

    items.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.title || ''}</td>  <!-- Title -->
            <td>${item.artist || ''}</td>  <!-- Artist -->
            <td>${item.album || ''}</td>  <!-- Album -->
            <td>${item.genre || ''}</td>  <!-- Genre -->
            <td>
                <button class="btn btn-primary btn-sm" 
                    onclick='editTrack(${JSON.stringify(item)})'>
                    Edit
                </button>
            </td>
        `;
        libraryResults.appendChild(row);
    });
}

function editTrack(track) {
    const formHtml = `
        <h5>Edit Track</h5>
        <label>Title: <input type="text" id="editTitle" class="form-control" value="${track.title}"></label>
        <label>Artist: <input type="text" id="editArtist" class="form-control" value="${track.artist}"></label>
        <label>Album: <input type="text" id="editAlbum" class="form-control" value="${track.album}"></label>
        <label>Year: <input type="text" id="editYear" class="form-control" value="${track.year}"></label>
        <label>Genre: <input type="text" id="editGenre" class="form-control" value="${track.genre}"></label>
        <label>Composer: <input type="text" id="editComposer" class="form-control" value="${track.composer}"></label>
        <label>BPM: <input type="text" id="editBpm" class="form-control" value="${track.bpm}"></label>
        <label>Comments: <textarea id="editComments" class="form-control"> ${track.comments}</textarea></label>
        <button class="btn btn-warning mt-2" onclick="confirmAction('remove', '${track.title}', '${track.artist}', '${track.album}')">Remove</button>
        <button class="btn btn-danger mt-2" onclick="confirmAction('delete', '${track.title}', '${track.artist}', '${track.album}')">Delete</button>
        <button class="btn btn-success mt-2" onclick="saveTrack('${track.title}', '${track.artist}', '${track.album}')">Save</button>
        
        <button class="btn btn-secondary mt-2" onclick="closeEditForm()">Cancel</button>
    `;
    const editFormContainer = document.getElementById('editFormContainer');
    editFormContainer.innerHTML = formHtml; 
}

function saveTrack(originalTitle, originalArtist, originalAlbum) {
    const updatedTrack = {
        title: document.getElementById('editTitle').value,
        artist: document.getElementById('editArtist').value,
        album: document.getElementById('editAlbum').value,
        year: document.getElementById('editYear').value,
        genre: document.getElementById('editGenre').value,
        composer: document.getElementById('editComposer').value,
        bpm: document.getElementById('editBpm').value,
        comments: document.getElementById('editComments').value,
    };

    fetch('/api/library/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalTitle, originalArtist, originalAlbum, updatedTrack })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message || 'Track updated successfully.');
        fetchLibrary();  
        closeEditForm();
    })
    .catch(error => {
        alert('Error updating track: ' + error.message);
    });
}

function removeTrack(title, artist, album) {
    if (!confirm('Are you sure you want to remove this track from the library?')) return;

    fetch('/api/library/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, artist, album })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Remove response:', data);
        if (data.message) {
            alert(data.message || 'Track removed successfully.');
        } else {
            alert('Failed to remove track: ' + (data.error || 'Unknown error.'));
        }
        fetchLibrary();  
        closeEditForm();
    })
    .catch(error => {
        console.error('Error removing track:', error);
        alert('Error removing track: ' + error.message);
    });
}

function deleteTrack(title, artist, album) {
    if (!confirm('Are you sure you want to delete this track? This action cannot be undone.')) return;

    fetch('/api/library/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, artist, album })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log('Delete response:', data);
        if (data.message) {
            alert(data.message || 'Track deleted successfully.');
        } else {
            alert('Failed to delete track: ' + (data.error || 'Unknown error.'));
        }
        fetchLibrary();  
        closeEditForm(); 
    })
    .catch(error => {
        console.error('Error deleting track:', error);
        alert('Error deleting track: ' + error.message);
    });
}


function closeEditForm() {
    const editFormContainer = document.getElementById('editFormContainer');
    editFormContainer.innerHTML = '';  
    editFormContainer.style.display = 'none';  
}



function debugLibrary() {
    fetch('/api/debug_library')
        .then(response => response.json())
        .then(data => {
            console.log('Raw items:', data.raw_items);
            console.log('Parsed items:', data.parsed_items);
        })
        .catch(error => console.error('Error fetching debug data:', error));
}



function confirmAction(action, title, artist, album) {
    const actionText = action === 'delete' ? 'delete this track? This action cannot be undone.' : 'remove this track from the library?';
    const modalHtml = `
        <div class="modal fade" id="confirmationModal" tabindex="-1" aria-labelledby="confirmationModalLabel" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="confirmationModalLabel">Confirm Action</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        Are you sure you want to ${actionText}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-danger" onclick="executeAction('${action}', '${title}', '${artist}', '${album}')">Confirm</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const confirmationModal = new bootstrap.Modal(document.getElementById('confirmationModal'));
    confirmationModal.show();
}

function executeAction(action, title, artist, album) {
    const endpoint = action === 'delete' ? '/api/library/delete' : '/api/library/remove';
    fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, artist, album })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        alert(data.message || `Track ${action}d successfully.`);
        fetchLibrary();  
        closeEditForm();
        document.getElementById('confirmationModal').remove();
    })
    .catch(error => {
        alert(`Error ${action}ing track: ${error.message}`);
        document.getElementById('confirmationModal').remove();
    });
}