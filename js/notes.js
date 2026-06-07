import { AppState } from "./state.js";
import { validateRequired, escapeHTML } from "./utils.js";

let editingNoteId = null;
let currentDrawerNoteId = null;
let drawerOriginalTitle = null;
let drawerOriginalContent = null;
const TRUNCATE_LENGTH = 120;


export function initNotesPage() {
    const noteForm = document.getElementById("note-form");
    const notesListContainer = document.getElementById("notes-list-container");
    const cancelEditBtn = document.getElementById("cancel-edit-btn");

    // Add New Note trigger button click handler
    const openModalBtn = document.getElementById("open-add-note-btn");
    if (openModalBtn) {
        openModalBtn.addEventListener("click", () => {
            editingNoteId = null;
            const formEl = document.getElementById("note-form");
            if (formEl) {
                formEl.reset();
            }
            const titleText = document.getElementById("modal-title-text");
            if (titleText) {
                titleText.textContent = "Create Note";
            }
            const submitBtn = document.querySelector("#note-form button.primary-btn[type='submit']");
            if (submitBtn) {
                submitBtn.textContent = "Save Note";
            }
            const cancelBtn = document.getElementById("cancel-edit-btn");
            if (cancelBtn) {
                cancelBtn.hidden = true;
            }

            const modal = document.getElementById("add-note-modal");
            if (modal) {
                modal.style.display = "flex";
                modal.setAttribute("aria-hidden", "false");
                const titleInput = document.getElementById("note-title");
                if (titleInput) {
                    titleInput.focus();
                }
            }
        });
    }

    // Modal Close buttons click handlers
    const closeModalBtn = document.getElementById("close-modal-btn");
    if (closeModalBtn) {
        closeModalBtn.addEventListener("click", () => {
            cancelEditingNote();
        });
    }

    const modalOverlay = document.getElementById("add-note-modal");
    if (modalOverlay) {
        modalOverlay.addEventListener("click", (event) => {
            if (event.target === modalOverlay) {
                cancelEditingNote();
            }
        });
    }

    // Dismiss modal or drawer on Escape key
    window.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            // Close inline detail panel first if open
            const container = document.getElementById("notes-split-container");
            if (container && container.classList.contains("detail-open")) {
                closeNoteDrawer();
                return;
            }
            const modal = document.getElementById("add-note-modal");
            if (modal && modal.style.display === "flex") {
                cancelEditingNote();
            }
        }
    });

    if (cancelEditBtn) {
        cancelEditBtn.addEventListener("click", cancelEditingNote);
    }
    if (notesListContainer) {
        notesListContainer.addEventListener("click", handleNoteListClick);
    }

    if (noteForm) {
        noteForm.addEventListener("submit", handleNoteFormSubmit);
    }

    // Drawer close triggers
    const drawerCloseBtn = document.getElementById("drawer-close-btn");
    if (drawerCloseBtn) {
        drawerCloseBtn.addEventListener("click", closeNoteDrawer);
    }
    const drawerDeleteBtn = document.getElementById("drawer-delete-btn");
    if (drawerDeleteBtn) {
        drawerDeleteBtn.addEventListener("click", () => {
            if (currentDrawerNoteId) {
                const noteId = currentDrawerNoteId;
                closeNoteDrawer();
                try {
                    deleteNote(noteId);
                    renderNotes();
                    renderNoteStats();
                } catch (error) {
                    alert(error.message);
                }
            }
        });
    }

    // Drawer inline editing toolbar actions (formatting, save, cancel)
    const drawerToolbar = document.getElementById('drawer-toolbar');
    const formatButtons = document.querySelectorAll('.format-btn');
    formatButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const cmd = e.currentTarget.dataset.cmd;
            if (!cmd) return;
            document.execCommand(cmd, false, null);
        });
    });

    const drawerSaveBtn = document.getElementById('drawer-save-btn');
    if (drawerSaveBtn) {
        drawerSaveBtn.addEventListener('click', () => {
            if (!currentDrawerNoteId) return;
            const titleEl = document.getElementById('drawer-note-title');
            const contentEl = document.getElementById('drawer-note-content');
            const title = titleEl ? titleEl.innerText.trim() : '';
            const content = contentEl ? contentEl.innerHTML : '';
            try {
                updateNote(currentDrawerNoteId, { title, content });
                renderNotes();
                renderNoteStats();
                openNoteDrawer(currentDrawerNoteId);
            } catch (err) {
                alert(err.message);
            }
        });
    }

    const drawerCancelEditBtn = document.getElementById('drawer-cancel-edit-btn');
    if (drawerCancelEditBtn) {
        drawerCancelEditBtn.addEventListener('click', () => {
            if (!currentDrawerNoteId) return;
            // Re-open to discard unsaved edits
            openNoteDrawer(currentDrawerNoteId);
        });
    }

    // Add change detection listeners to drawer editable elements
    const drawerTitleEl = document.getElementById('drawer-note-title');
    const drawerContentEl = document.getElementById('drawer-note-content');
    if (drawerTitleEl) {
        drawerTitleEl.addEventListener('input', checkDrawerChanges);
        drawerTitleEl.addEventListener('blur', checkDrawerChanges);
    }
    if (drawerContentEl) {
        drawerContentEl.addEventListener('input', checkDrawerChanges);
        drawerContentEl.addEventListener('blur', checkDrawerChanges);
    }
    renderNotes();
    renderNoteStats();
}

export function handleNoteFormSubmit(event) {
    event.preventDefault();
    try {
        const formData = getNoteFormData();
        if (formData) {
            if (editingNoteId) {
                updateNote(editingNoteId, formData);
                editingNoteId = null;
                const submitBtn = event.target.querySelector("button.primary-btn[type='submit']");
                const cancelBtn = document.getElementById("cancel-edit-btn");
                if (submitBtn) {
                    submitBtn.textContent = "Save Note";
                }
                if (cancelBtn) {
                    cancelBtn.hidden = true;
                }
            }
            else {
                createNote(formData);
            }
        }
        renderNotes();
        renderNoteStats();
        event.target.reset();

        // Hide modal overlay
        const modal = document.getElementById("add-note-modal");
        if (modal) {
            modal.style.display = "none";
            modal.setAttribute("aria-hidden", "true");
        }
    }
    catch (error) {
        alert(`Error creating note: ${error.message}`);
    }
}

export function getNoteFormData() {
    const titleInput = document.getElementById("note-title");
    const contentInput = document.getElementById("note-content");
    if (!titleInput || !contentInput) {
        throw new Error("Title and content are required");
    }
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    if (title === '' || content === '') {
        throw new Error("Title and content cannot be empty");
    }
    return { title, content };
}

export function createNote(noteData) {
    if (!noteData || typeof noteData !== "object") {
        throw new Error("Invalid note data");
    }
    if (!validateRequired(noteData.title)) {
        throw new Error("Note title is required");
    }
    if (!validateRequired(noteData.content)) {
        throw new Error("Note content is required");
    }
    const noteId = crypto.randomUUID();
    const newNote = {
        noteId: noteId,
        noteTitle: noteData.title,
        noteContent: noteData.content || "",
        createdAt: new Date().toISOString(),
        updatedAt: null,
    };
    AppState.notes.push(newNote);
    AppState.save();
    return newNote;
}

export function renderNotes() {
    const notesContainer = document.getElementById("notes-list-container");

    if (!notesContainer) {
        return;
    }

    const notes = [...AppState.notes]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (notes.length === 0) {
        notesContainer.innerHTML = "<div class='no-notes'><h3>No Notes Yet</h3><p>Create your first note to get started!</p></div>";
        return;
    }

    const notesHTML = notes.map(note => {
        const dateStr = new Date(note.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
        const timeStr = new Date(note.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

        let metaText = `<strong>Created:</strong> ${timeStr} on ${dateStr}`;
        if (note.updatedAt) {
            const updDateStr = new Date(note.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
            const updTimeStr = new Date(note.updatedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
            metaText = `<strong>Updated:</strong> ${updTimeStr} on ${updDateStr}`;
        }

        // Truncate content for list preview
        const rawContent = escapeHTML(note.noteContent);
        const isTruncated = rawContent.length > TRUNCATE_LENGTH;
        const previewContent = isTruncated
            ? rawContent.substring(0, TRUNCATE_LENGTH).replace(/\n/g, ' ') + '…'
            : rawContent.replace(/\n/g, '<br>');

        return `
            <div class="note-card" data-note-id="${escapeHTML(note.noteId)}">
                <div class="note-card-header">
                    <h3 class="note-title">${escapeHTML(note.noteTitle)}</h3>
                </div>
                <div class="note-card-body">
                    <p class="note-content-text">${previewContent}</p>
                </div>
                <div class="note-card-footer">
                    <div class="note-meta">
                        <span class="note-date-text">${metaText}</span>
                    </div>
                    <div class="note-actions">
                        <button type="button" class="delete-note-btn" data-action="delete">Delete</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    notesContainer.innerHTML = notesHTML;
}

export function handleNoteListClick(event) {
    const action = event.target.dataset.action;
    const noteCard = event.target.closest("[data-note-id]");
    if (!noteCard) return;

    const noteId = noteCard.dataset.noteId;

    // If a button action was clicked, handle edit/delete
    if (action) {
        try {
            if (action === "delete") {
                deleteNote(noteId);
            }
            renderNotes();
            renderNoteStats();
        } catch (error) {
            alert(error.message);
        }
        return;
    }

    // Otherwise, open the detail drawer
    openNoteDrawer(noteId);
}

export function deleteNote(noteId) {
    const noteIndex = AppState.notes.findIndex(note => note.noteId === noteId);
    if (noteIndex === -1) {
        throw new Error("Note not found");
    }
    AppState.notes.splice(noteIndex, 1);
    AppState.save();
    return true;
}

export function startEditingNote(noteId) {
    const note = AppState.notes.find(note => note.noteId === noteId);
    if (!note) {
        throw new Error("Note not found");
    }
    editingNoteId = noteId;
    document.getElementById("note-title").value = note.noteTitle;
    document.getElementById("note-content").value = note.noteContent;

    // Set modal headers
    const titleText = document.getElementById("modal-title-text");
    if (titleText) {
        titleText.textContent = "Edit Note";
    }
    const cancelBtn = document.getElementById("cancel-edit-btn");
    if (cancelBtn) {
        cancelBtn.hidden = false;
    }
    const submitBtn = document.querySelector("#note-form button.primary-btn[type='submit']");
    if (submitBtn) {
        submitBtn.textContent = "Update Note";
    }

    // Show modal overlay
    const modal = document.getElementById("add-note-modal");
    if (modal) {
        modal.style.display = "flex";
        modal.setAttribute("aria-hidden", "false");
    }
}

export function updateNote(noteId, noteData) {
    const note = AppState.notes.find((note) => note.noteId === noteId);
    if (!note) {
        throw new Error("Note not found");
    }

    if (!noteData || typeof noteData !== "object") {
        throw new Error("Invalid note data");
    }
    if (!validateRequired(noteData.title) || !validateRequired(noteData.content)) {
        throw new Error("Note title and content are required");
    }
    const updatedNote = {
        noteTitle: noteData.title,
        noteContent: noteData.content || "",
        updatedAt: new Date().toISOString(),
    };
    Object.assign(note, updatedNote);
    AppState.save();
    return note;
}

export function cancelEditingNote() {
    editingNoteId = null;
    const form = document.getElementById("note-form");
    if (form) {
        form.reset();
    }
    const titleText = document.getElementById("modal-title-text");
    if (titleText) {
        titleText.textContent = "Create Note";
    }
    const submitBtn = document.querySelector("#note-form button.primary-btn[type='submit']");
    if (submitBtn) {
        submitBtn.textContent = "Save Note";
    }
    const cancelBtn = document.getElementById("cancel-edit-btn");
    if (cancelBtn) {
        cancelBtn.hidden = true;
    }

    // Hide modal overlay
    const modal = document.getElementById("add-note-modal");
    if (modal) {
        modal.style.display = "none";
        modal.setAttribute("aria-hidden", "true");
    }
}


export function openNoteDrawer(noteId) {
    const note = AppState.notes.find(n => n.noteId === noteId);
    if (!note) return;

    currentDrawerNoteId = noteId;

    const titleEl = document.getElementById("drawer-note-title");
    const metaEl = document.getElementById("drawer-note-meta");
    const contentEl = document.getElementById("drawer-note-content");

    if (titleEl) {
        titleEl.textContent = note.noteTitle;
        drawerOriginalTitle = note.noteTitle;
    }

    if (metaEl) {
        const createdDate = new Date(note.createdAt);
        const createdStr = createdDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) + ' on ' + createdDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
        let metaHTML = `<span class="drawer-meta-item"><strong>Created:</strong> ${createdStr}</span>`;
        if (note.updatedAt) {
            const updatedDate = new Date(note.updatedAt);
            const updatedStr = updatedDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) + ' on ' + updatedDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
            metaHTML += `<span class="drawer-meta-item"><strong>Updated:</strong> ${updatedStr}</span>`;
        }
        metaEl.innerHTML = metaHTML;
    }

    if (contentEl) {
        // Render saved HTML content (notes may contain simple formatting)
        if (note.noteContent && note.noteContent.indexOf('<') !== -1) {
            contentEl.innerHTML = note.noteContent;
        } else {
            contentEl.innerHTML = escapeHTML(note.noteContent).replace(/\n/g, '<br>');
        }
        drawerOriginalContent = contentEl.innerHTML;
        // Show toolbar and allow inline editing
        const toolbar = document.getElementById('drawer-toolbar');
        if (toolbar) toolbar.style.display = 'flex';
    }

    // Disable save/cancel buttons initially
    disableDrawerButtons();

    const container = document.getElementById("notes-split-container");
    const panel = document.getElementById("note-detail-panel");
    if (container && panel) {
        container.classList.add("detail-open");
        panel.setAttribute("aria-hidden", "false");
    }

    // Highlight the active note card
    document.querySelectorAll(".note-card").forEach(c => c.classList.remove("note-card-active"));
    const activeCard = document.querySelector(`.note-card[data-note-id="${noteId}"]`);
    if (activeCard) activeCard.classList.add("note-card-active");
}

// Helper function to disable drawer action buttons
function disableDrawerButtons() {
    const saveBtnEl = document.getElementById('drawer-save-btn');
    const cancelBtnEl = document.getElementById('drawer-cancel-edit-btn');
    if (saveBtnEl) saveBtnEl.disabled = true;
    if (cancelBtnEl) cancelBtnEl.disabled = true;
}

// Helper function to enable drawer action buttons
function enableDrawerButtons() {
    const saveBtnEl = document.getElementById('drawer-save-btn');
    const cancelBtnEl = document.getElementById('drawer-cancel-edit-btn');
    if (saveBtnEl) saveBtnEl.disabled = false;
    if (cancelBtnEl) cancelBtnEl.disabled = false;
}

// Helper function to check if there are changes in the drawer
function checkDrawerChanges() {
    const titleEl = document.getElementById('drawer-note-title');
    const contentEl = document.getElementById('drawer-note-content');

    const currentTitle = titleEl ? titleEl.innerText.trim() : '';
    const currentContent = contentEl ? contentEl.innerHTML : '';

    const hasChanges = (currentTitle !== drawerOriginalTitle) || (currentContent !== drawerOriginalContent);

    if (hasChanges) {
        enableDrawerButtons();
    } else {
        disableDrawerButtons();
    }
}

export function closeNoteDrawer() {
    currentDrawerNoteId = null;
    const container = document.getElementById("notes-split-container");
    const panel = document.getElementById("note-detail-panel");
    if (container && panel) {
        container.classList.remove("detail-open");
        panel.setAttribute("aria-hidden", "true");
    }
    document.querySelectorAll(".note-card").forEach(c => c.classList.remove("note-card-active"));
}

export function getNoteStats() {
    return {
        totalNotes: AppState.notes.length,

        notesCreatedToday: AppState.notes.filter(note => {
            const today = new Date().toDateString();
            return new Date(note.createdAt).toDateString() === today;
        }).length,

        notesUpdatedThisWeek: AppState.notes.filter(note => {
            if (!note.updatedAt) return false;

            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

            return new Date(note.updatedAt) >= oneWeekAgo;
        }).length,

        oldestNote: AppState.notes
            .slice()
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0],

        latestNote: AppState.notes
            .slice()
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0],
    };
}


export function renderNoteStats() {
    const stats = getNoteStats();
    const totalNotesEl = document.getElementById("total-notes-count");
    const notesCreatedTodayEl = document.getElementById("notes-created-today-count");
    const notesUpdatedThisWeekEl = document.getElementById("notes-updated-this-week-count");
    // const oldestNoteEl = document.getElementById("oldest-note-info");
    // const latestNoteEl = document.getElementById("latest-note-info");
    if (!totalNotesEl || !notesCreatedTodayEl || !notesUpdatedThisWeekEl) {
        return;
    }
    totalNotesEl.textContent = stats.totalNotes;
    notesCreatedTodayEl.textContent = stats.notesCreatedToday;
    notesUpdatedThisWeekEl.textContent = stats.notesUpdatedThisWeek;
    // oldestNoteEl.textContent = stats.oldestNote ? `${stats.oldestNote.noteTitle} (${new Date(stats.oldestNote.createdAt).toLocaleDateString()})` : "N/A";
    // latestNoteEl.textContent = stats.latestNote ? `${stats.latestNote.noteTitle} (${new Date(stats.latestNote.createdAt).toLocaleDateString()})` : "N/A";
}