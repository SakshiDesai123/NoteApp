// Note App - Main JavaScript File

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const noteEditor = document.getElementById('note-editor');
    const notesList = document.getElementById('notes-list');
    const emptyState = document.getElementById('empty-state');
    const totalNotesEl = document.getElementById('total-notes');
    const totalCharsEl = document.getElementById('total-chars');
    const searchInput = document.getElementById('search-input');
    const themeToggle = document.getElementById('theme-toggle');
    const categoryButtons = document.querySelectorAll('.category-btn');
    const tagsList = document.getElementById('tags-list');
    const newNoteBtn = document.getElementById('new-note-btn');
    const saveNoteBtn = document.getElementById('save-note-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const noteTitle = document.getElementById('note-title');
    const noteContent = document.getElementById('note-content');
    const noteCategory = document.getElementById('note-category');
    const tagInput = document.getElementById('tag-input');
    const addTagBtn = document.getElementById('add-tag-btn');
    const selectedTags = document.getElementById('selected-tags');
    const charCounter = document.getElementById('char-counter');
    const colorOptions = document.querySelectorAll('.color-option');
    const formatButtons = document.querySelectorAll('.format-btn');
    const gridViewBtn = document.getElementById('grid-view-btn');
    const listViewBtn = document.getElementById('list-view-btn');
    const notesTitle = document.getElementById('notes-title');
    const exportBtn = document.getElementById('export-btn');
    const importBtn = document.getElementById('import-btn');
    const importFile = document.getElementById('import-file');
    const clearBtn = document.getElementById('clear-btn');
    const confirmationModal = document.getElementById('confirmation-modal');
    const modalCancel = document.getElementById('modal-cancel');
    const modalConfirm = document.getElementById('modal-confirm');
    
    // State variables
    let notes = [];
    let currentNoteId = null;
    let isEditing = false;
    let selectedCategory = 'all';
    let selectedTagsArray = [];
    let selectedColor = '#ffffff';
    let currentView = 'grid';
    let noteToDelete = null;
    
    // Initialize the app
    function init() {
        loadNotes();
        updateStats();
        renderNotes();
        updateCategoryCounts();
        updateTagsList();
        
        // Set initial view
        setView('grid');
        
        // Check for saved theme preference
        const savedTheme = localStorage.getItem('noteAppTheme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        }
    }
    
    // Load notes from localStorage
    function loadNotes() {
        const savedNotes = localStorage.getItem('notes');
        if (savedNotes) {
            notes = JSON.parse(savedNotes);
        }
    }
    
    // Save notes to localStorage
    function saveNotes() {
        localStorage.setItem('notes', JSON.stringify(notes));
        updateStats();
        updateCategoryCounts();
        updateTagsList();
    }
    
    // Update statistics
    function updateStats() {
        totalNotesEl.textContent = notes.length;
        
        let totalChars = 0;
        notes.forEach(note => {
            totalChars += note.content.length + note.title.length;
        });
        
        totalCharsEl.textContent = totalChars.toLocaleString();
    }
    
    // Update category counts
    function updateCategoryCounts() {
        const counts = {
            all: notes.length,
            personal: 0,
            work: 0,
            ideas: 0,
            important: 0
        };
        
        notes.forEach(note => {
            if (note.category && counts[note.category] !== undefined) {
                counts[note.category]++;
            }
        });
        
        document.getElementById('count-all').textContent = counts.all;
        document.getElementById('count-personal').textContent = counts.personal;
        document.getElementById('count-work').textContent = counts.work;
        document.getElementById('count-ideas').textContent = counts.ideas;
        document.getElementById('count-important').textContent = counts.important;
    }
    
    // Update tags list in sidebar
    function updateTagsList() {
        // Collect all tags from notes
        const allTags = [];
        notes.forEach(note => {
            if (note.tags && Array.isArray(note.tags)) {
                note.tags.forEach(tag => {
                    if (!allTags.includes(tag)) {
                        allTags.push(tag);
                    }
                });
            }
        });
        
        // Clear and rebuild tags list
        tagsList.innerHTML = '';
        
        allTags.forEach(tag => {
            const tagEl = document.createElement('button');
            tagEl.className = 'tag';
            tagEl.textContent = tag;
            tagEl.dataset.tag = tag;
            tagEl.addEventListener('click', () => filterByTag(tag));
            tagsList.appendChild(tagEl);
        });
    }
    
    // Filter notes by tag
    function filterByTag(tag) {
        const tagButtons = document.querySelectorAll('.tag');
        tagButtons.forEach(btn => {
            if (btn.dataset.tag === tag) {
                btn.classList.toggle('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        renderNotes();
    }
    
    // Render notes based on filters
    function renderNotes() {
        // Clear the notes list
        notesList.innerHTML = '';
        
        // Get active tag filters
        const activeTags = Array.from(document.querySelectorAll('.tag.active'))
            .map(tag => tag.dataset.tag);
        
        // Filter notes
        let filteredNotes = notes.filter(note => {
            // Filter by category
            if (selectedCategory !== 'all' && note.category !== selectedCategory) {
                return false;
            }
            
            // Filter by tags
            if (activeTags.length > 0) {
                const noteTags = note.tags || [];
                const hasActiveTag = activeTags.some(tag => noteTags.includes(tag));
                if (!hasActiveTag) return false;
            }
            
            // Filter by search
            const searchTerm = searchInput.value.toLowerCase();
            if (searchTerm) {
                const inTitle = note.title.toLowerCase().includes(searchTerm);
                const inContent = note.content.toLowerCase().includes(searchTerm);
                if (!inTitle && !inContent) return false;
            }
            
            return true;
        });
        
        // Sort notes: pinned first, then by modification date
        filteredNotes.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return new Date(b.modified) - new Date(a.modified);
        });
        
        // Update notes title
        let titleText = '';
        if (selectedCategory !== 'all') {
            titleText = selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1) + ' Notes';
        } else if (activeTags.length > 0) {
            titleText = 'Tagged Notes';
        } else if (searchInput.value) {
            titleText = 'Search Results';
        } else {
            titleText = 'All Notes';
        }
        
        notesTitle.textContent = titleText + ` (${filteredNotes.length})`;
        
        // Show empty state if no notes
        if (filteredNotes.length === 0) {
            emptyState.style.display = 'block';
            notesList.appendChild(emptyState);
            return;
        }
        
        emptyState.style.display = 'none';
        
        // Create note cards
        filteredNotes.forEach(note => {
            const noteCard = createNoteCard(note);
            notesList.appendChild(noteCard);
        });
    }
    
    // Create a note card element
    function createNoteCard(note) {
        const noteCard = document.createElement('div');
        noteCard.className = `note-card ${note.pinned ? 'pinned' : ''}`;
        noteCard.style.borderLeftColor = note.color || '#4a6bff';
        
        // Format date
        const modifiedDate = new Date(note.modified);
        const formattedDate = modifiedDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        
        // Truncate content for preview
        const truncatedContent = note.content.length > 150 
            ? note.content.substring(0, 150) + '...' 
            : note.content;
        
        noteCard.innerHTML = `
            <div class="note-card-header">
                <div>
                    <h3 class="note-card-title">${escapeHtml(note.title) || 'Untitled Note'}</h3>
                    <span class="note-card-category">${note.category || 'personal'}</span>
                </div>
                <div class="note-card-actions">
                    <button class="note-action-btn pin" title="${note.pinned ? 'Unpin' : 'Pin'}">
                        <i class="fas fa-thumbtack"></i>
                    </button>
                    <button class="note-action-btn edit" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="note-action-btn delete" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="note-card-content">${escapeHtml(truncatedContent)}</div>
            <div class="note-card-footer">
                <div class="note-card-tags">
                    ${(note.tags || []).map(tag => `<span class="note-card-tag">${escapeHtml(tag)}</span>`).join('')}
                </div>
                <div class="note-card-date">${formattedDate}</div>
            </div>
        `;
        
        // Add event listeners
        noteCard.addEventListener('click', (e) => {
            if (!e.target.closest('.note-card-actions')) {
                editNote(note.id);
            }
        });
        
        const pinBtn = noteCard.querySelector('.pin');
        pinBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            togglePinNote(note.id);
        });
        
        const editBtn = noteCard.querySelector('.edit');
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            editNote(note.id);
        });
        
        const deleteBtn = noteCard.querySelector('.delete');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showDeleteConfirmation(note.id);
        });
        
        return noteCard;
    }
    
    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Create a new note
    function createNewNote() {
        noteEditor.classList.add('active');
        noteTitle.value = '';
        noteContent.value = '';
        noteCategory.value = 'personal';
        selectedTagsArray = [];
        selectedColor = '#ffffff';
        currentNoteId = null;
        isEditing = false;
        
        updateSelectedTags();
        updateColorSelection();
        updateCharCount();
        
        // Focus on title
        setTimeout(() => noteTitle.focus(), 100);
    }
    
    // Edit an existing note
    function editNote(id) {
        const note = notes.find(note => note.id === id);
        if (!note) return;
        
        noteEditor.classList.add('active');
        noteTitle.value = note.title;
        noteContent.value = note.content;
        noteCategory.value = note.category || 'personal';
        selectedTagsArray = note.tags || [];
        selectedColor = note.color || '#ffffff';
        currentNoteId = id;
        isEditing = true;
        
        updateSelectedTags();
        updateColorSelection();
        updateCharCount();
        
        // Focus on title
        setTimeout(() => noteTitle.focus(), 100);
    }
    
    // Save note (create or update)
    function saveNote() {
        const title = noteTitle.value.trim();
        const content = noteContent.value.trim();
        const category = noteCategory.value;
        const tags = [...selectedTagsArray];
        const color = selectedColor;
        
        if (!title && !content) {
            alert('Note cannot be empty. Add a title or content.');
            return;
        }
        
        const now = new Date().toISOString();
        
        if (isEditing && currentNoteId) {
            // Update existing note
            const noteIndex = notes.findIndex(note => note.id === currentNoteId);
            if (noteIndex !== -1) {
                notes[noteIndex] = {
                    ...notes[noteIndex],
                    title,
                    content,
                    category,
                    tags,
                    color,
                    modified: now
                };
            }
        } else {
            // Create new note
            const newNote = {
                id: generateId(),
                title,
                content,
                category,
                tags,
                color,
                pinned: false,
                created: now,
                modified: now
            };
            
            notes.unshift(newNote);
        }
        
        // Save and update UI
        saveNotes();
        renderNotes();
        cancelEdit();
    }
    
    // Cancel editing
    function cancelEdit() {
        noteEditor.classList.remove('active');
        noteTitle.value = '';
        noteContent.value = '';
        selectedTagsArray = [];
        currentNoteId = null;
        isEditing = false;
    }
    
    // Toggle pin status of a note
    function togglePinNote(id) {
        const noteIndex = notes.findIndex(note => note.id === id);
        if (noteIndex !== -1) {
            notes[noteIndex].pinned = !notes[noteIndex].pinned;
            notes[noteIndex].modified = new Date().toISOString();
            saveNotes();
            renderNotes();
        }
    }
    
    // Delete a note
    function deleteNote(id) {
        notes = notes.filter(note => note.id !== id);
        saveNotes();
        renderNotes();
        hideDeleteConfirmation();
    }
    
    // Show delete confirmation modal
    function showDeleteConfirmation(id) {
        noteToDelete = id;
        confirmationModal.classList.add('active');
    }
    
    // Hide delete confirmation modal
    function hideDeleteConfirmation() {
        confirmationModal.classList.remove('active');
        noteToDelete = null;
    }
    
    // Update selected tags display
    function updateSelectedTags() {
        selectedTags.innerHTML = '';
        
        selectedTagsArray.forEach(tag => {
            const tagEl = document.createElement('span');
            tagEl.className = 'selected-tag';
            tagEl.innerHTML = `
                ${escapeHtml(tag)}
                <button class="remove-tag" data-tag="${escapeHtml(tag)}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            selectedTags.appendChild(tagEl);
        });
        
        // Add event listeners to remove buttons
        selectedTags.querySelectorAll('.remove-tag').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const tagToRemove = btn.dataset.tag;
                selectedTagsArray = selectedTagsArray.filter(tag => tag !== tagToRemove);
                updateSelectedTags();
            });
        });
    }
    
    // Update color selection
    function updateColorSelection() {
        colorOptions.forEach(option => {
            if (option.dataset.color === selectedColor) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });
    }
    
    // Update character count
    function updateCharCount() {
        const count = noteContent.value.length;
        charCounter.textContent = count.toLocaleString();
    }
    
    // Set view mode (grid or list)
    function setView(mode) {
        currentView = mode;
        
        if (mode === 'grid') {
            notesList.classList.remove('list-view');
            gridViewBtn.classList.add('active');
            listViewBtn.classList.remove('active');
        } else {
            notesList.classList.add('list-view');
            gridViewBtn.classList.remove('active');
            listViewBtn.classList.add('active');
        }
    }
    
    // Export notes as JSON file
    function exportNotes() {
        const dataStr = JSON.stringify(notes, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `notes-${new Date().toISOString().slice(0, 10)}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }
    
    // Import notes from JSON file
    function importNotes() {
        importFile.click();
    }
    
    // Clear all notes
    function clearAllNotes() {
        if (notes.length === 0) return;
        
        if (confirm('Are you sure you want to delete all notes? This cannot be undone.')) {
            notes = [];
            saveNotes();
            renderNotes();
        }
    }
    
    // Generate a unique ID
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    // Event Listeners
    
    // Theme toggle
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        
        if (document.body.classList.contains('dark-theme')) {
            localStorage.setItem('noteAppTheme', 'dark');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            localStorage.setItem('noteAppTheme', 'light');
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }
    });
    
    // Category filter buttons
    categoryButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedCategory = btn.dataset.category;
            renderNotes();
        });
    });
    
    // New note button
    newNoteBtn.addEventListener('click', createNewNote);
    
    // Save note button
    saveNoteBtn.addEventListener('click', saveNote);
    
    // Cancel button
    cancelBtn.addEventListener('click', cancelEdit);
    
    // Search input
    searchInput.addEventListener('input', () => {
        renderNotes();
    });
    
    // Add tag button
    addTagBtn.addEventListener('click', () => {
        const tag = tagInput.value.trim();
        if (tag && !selectedTagsArray.includes(tag)) {
            selectedTagsArray.push(tag);
            updateSelectedTags();
            tagInput.value = '';
        }
    });
    
    // Add tag on Enter key
    tagInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTagBtn.click();
        }
    });
    
    // Color options
    colorOptions.forEach(option => {
        option.addEventListener('click', () => {
            selectedColor = option.dataset.color;
            updateColorSelection();
        });
    });
    
    // Format buttons
    formatButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const format = btn.dataset.format;
            const textarea = noteContent;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const selectedText = textarea.value.substring(start, end);
            
            let formattedText = '';
            
            switch(format) {
                case 'bold':
                    formattedText = `**${selectedText}**`;
                    break;
                case 'italic':
                    formattedText = `*${selectedText}*`;
                    break;
                case 'underline':
                    formattedText = `__${selectedText}__`;
                    break;
                case 'list':
                    formattedText = selectedText.split('\n').map(line => `- ${line}`).join('\n');
                    break;
            }
            
            // Replace selected text with formatted text
            textarea.value = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);
            
            // Set cursor position after inserted text
            textarea.selectionStart = textarea.selectionEnd = start + formattedText.length;
            textarea.focus();
        });
    });
    
    // Character count
    noteContent.addEventListener('input', updateCharCount);
    
    // View mode buttons
    gridViewBtn.addEventListener('click', () => setView('grid'));
    listViewBtn.addEventListener('click', () => setView('list'));
    
    // Export/Import buttons
    exportBtn.addEventListener('click', exportNotes);
    importBtn.addEventListener('click', importNotes);
    
    // Import file change
    importFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedNotes = JSON.parse(e.target.result);
                
                if (Array.isArray(importedNotes)) {
                    // Merge imported notes with existing ones
                    const existingIds = notes.map(note => note.id);
                    const newNotes = importedNotes.filter(note => !existingIds.includes(note.id));
                    
                    notes = [...notes, ...newNotes];
                    saveNotes();
                    renderNotes();
                    
                    alert(`Imported ${newNotes.length} notes successfully!`);
                } else {
                    alert('Invalid notes file format.');
                }
            } catch (error) {
                alert('Error reading notes file. Please make sure it is a valid JSON file.');
            }
            
            // Reset file input
            importFile.value = '';
        };
        
        reader.readAsText(file);
    });
    
    // Clear all button
    clearBtn.addEventListener('click', clearAllNotes);
    
    // Modal actions
    modalCancel.addEventListener('click', hideDeleteConfirmation);
    modalConfirm.addEventListener('click', () => {
        if (noteToDelete) {
            deleteNote(noteToDelete);
        }
    });
    
    // Close modal when clicking outside
    confirmationModal.addEventListener('click', (e) => {
        if (e.target === confirmationModal) {
            hideDeleteConfirmation();
        }
    });
    
    // Initialize the app
    init();
});