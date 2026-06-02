import { AppState } from "./state.js";
import { validateRequired } from "./utils.js";

let editingNoteId = null;


export function initNotesPage() {
    const noteForm = document.getElementById("note-form");
    const notesListContainer = document.getElementById("notes-list-container");
    const cancelEditBtn = document.getElementById("cancel-edit-btn");
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener("click", cancelEditingNote);
    }
    if (notesListContainer) {
        notesListContainer.addEventListener("click", handleNoteListClick);
    }

    if (noteForm) {
        noteForm.addEventListener("submit", handleNoteFormSubmit);
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
                    submitBtn.textContent = "Add Note";
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
        event.target.reset();
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
        notesContainer.innerHTML = "<div class='no-notes'><p>No notes yet.</p><p>Add a note to get started!</p></div>";
        return;
    }

    const notesHTML = notes.map(note => `
        <div class="note-item" data-note-id="${note.noteId}">
            <h3>${note.noteTitle}</h3>
            <p>${note.noteContent}</p>
            <p class="note-date">Created: ${new Date(note.createdAt).toLocaleString()}</p>
            <div class="note-actions">
                <button type="button" class="edit-note-btn" data-action="edit">Edit</button>
                <button type="button" class="delete-note-btn" data-action="delete">Delete</button>
            </div>
        </div>
    `).join('');

    notesContainer.innerHTML = notesHTML;
}

export function handleNoteListClick(event) {
    const action = event.target.dataset.action;
    if (!action) {
        return;
    }

    const noteCard = event.target.closest("[data-note-id]");
    if (!noteCard) return;

    const noteId = noteCard.dataset.noteId;

    try {
        if (action === "edit") {
            startEditingNote(noteId);
        }

        else if (action === "delete") {
            deleteNote(noteId);
        }
        renderNotes();
    } catch (error) {
        alert(error.message);
    }
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
    const cancelBtn = document.getElementById("cancel-edit-btn");
    if (cancelBtn) {
        cancelBtn.hidden = false;
    }
    const submitBtn = document.querySelector("button.primary-btn[type='submit']");
    if (submitBtn) {
        submitBtn.textContent = "Update Note";
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
    document.getElementById("note-form").reset();
    const submitBtn = document.querySelector("button.primary-btn[type='submit']");
    if (submitBtn) {
        submitBtn.textContent = "Add Note";
    }
    const cancelBtn = document.getElementById("cancel-edit-btn");
    if (cancelBtn) {
        cancelBtn.hidden = true;
    }
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