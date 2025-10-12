// app/components/LearningSpace.js
'use client';

import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import styles from './LearningSpace.module.css';
import {
  PlusIcon, SearchIcon, PinIcon, EditIcon, TrashIcon,
  DownloadIcon, FileIcon, XIcon, SaveIcon, EyeIcon
} from '../components/icons';

const TAG_OPTIONS = ['GOAL', 'RESOURCE', 'PROGRESS', 'HOMEWORK', 'GENERAL'];

const TAG_COLORS = {
  GOAL: '#10B981',
  RESOURCE: '#6366F1',
  PROGRESS: '#F59E0B',
  HOMEWORK: '#EC4899',
  GENERAL: '#6B7280'
};

export default function LearningSpace({ connection, currentUserId }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [viewingNote, setViewingNote] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: [],
    file: null
  });
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const isMentor = connection.mentorId === currentUserId;

  useEffect(() => {
    loadNotes();
  }, [connection.id]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/notes?connectionId=${connection.id}&userId=${currentUserId}`
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to load notes');
      }
      
      const data = await response.json();
      setNotes(data.notes || []);
    } catch (error) {
      console.error('Error loading notes:', error);
      toast.error('Failed to load notes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async (e) => {
    e.preventDefault();
    
    if (!isMentor) {
      toast.error('Only mentors can create notes');
      return;
    }

    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    setSubmitting(true);

    const createPromise = (async () => {
      const data = new FormData();
      data.append('connectionId', connection.id);
      data.append('userId', currentUserId);
      data.append('title', formData.title.trim());
      data.append('content', formData.content.trim());
      data.append('tags', JSON.stringify(formData.tags));
      
      if (formData.file) {
        data.append('file', formData.file);
      }

      const response = await fetch('/api/notes', {
        method: 'POST',
        body: data
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create note');
      }

      await loadNotes();
      setShowCreateModal(false);
      resetForm();
    })();

    toast.promise(createPromise, {
      loading: 'Creating note...',
      success: 'Note created successfully!',
      error: (err) => err.message || 'Failed to create note',
    }).finally(() => {
      setSubmitting(false);
    });
  };

  const handleUpdateNote = async (e) => {
    e.preventDefault();
    
    if (!isMentor) {
      toast.error('Only mentors can edit notes');
      return;
    }

    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    setSubmitting(true);

    const updatePromise = (async () => {
      const response = await fetch(`/api/notes/${editingNote.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          title: formData.title.trim(),
          content: formData.content.trim(),
          tags: formData.tags
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update note');
      }

      await loadNotes();
      setEditingNote(null);
      resetForm();
    })();

    toast.promise(updatePromise, {
      loading: 'Updating note...',
      success: 'Note updated successfully!',
      error: (err) => err.message || 'Failed to update note',
    }).finally(() => {
      setSubmitting(false);
    });
  };

  const handleDeleteNote = async (noteId) => {
    if (!isMentor) {
      toast.error('Only mentors can delete notes');
      return;
    }

    // Create a custom confirmation toast
    toast((t) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <span style={{ fontWeight: '600', fontSize: '15px' }}>Delete Note?</span>
        <span style={{ fontSize: '14px', color: '#6B7280' }}>
          Are you sure you want to delete this note? This action cannot be undone.
        </span>
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              performDelete(noteId);
            }}
            style={{
              flex: 1,
              padding: '8px 16px',
              background: '#DC2626',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Delete
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            style={{
              flex: 1,
              padding: '8px 16px',
              background: '#F3F4F6',
              color: '#374151',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    ), {
      duration: Infinity,
      style: {
        minWidth: '350px',
        padding: '16px'
      }
    });
  };

  const performDelete = async (noteId) => {

    const deletePromise = (async () => {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete note');
      }

      await loadNotes();
    })();

    toast.promise(deletePromise, {
      loading: 'Deleting note...',
      success: 'Note deleted successfully!',
      error: (err) => err.message || 'Failed to delete note',
    });
  };

  const handlePinToggle = async (note) => {
    if (!isMentor) {
      toast.error('Only mentors can pin/unpin notes');
      return;
    }

    try {
      const response = await fetch(`/api/notes/${note.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          isPinned: !note.isPinned
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update note');
      }

      await loadNotes();
    } catch (error) {
      console.error('Error toggling pin:', error);
      toast.error(error.message || 'Failed to update note. Please try again.');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error('File size must be less than 10MB');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      setFormData({ ...formData, file });
    }
  };

  const resetForm = () => {
    setFormData({ title: '', content: '', tags: [], file: null });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openEditModal = (note) => {
    if (!isMentor) {
      toast.error('Only mentors can edit notes');
      return;
    }

    setEditingNote(note);
    setFormData({
      title: note.title,
      content: note.content,
      tags: note.tags,
      file: null
    });
  };

  const openViewModal = (note) => {
    setViewingNote(note);
  };

  const closeModal = () => {
    setTimeout(() => {
      setShowCreateModal(false);
      setEditingNote(null);
      setViewingNote(null);
      resetForm();
    }, 0);
  };

  const toggleTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const toggleFilterTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const filteredNotes = notes
    .filter(note => {
      const matchesSearch = 
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTags = selectedTags.length === 0 ||
        selectedTags.some(tag => note.tags.includes(tag));
      
      return matchesSearch && matchesTags;
    })
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  const otherUser = connection.mentorId === currentUserId
    ? connection.student
    : connection.mentor;

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading learning space...</p>
      </div>
    );
  }

  return (
    <div className={styles.learningSpace}>
      <div className={styles.header}>
        <div>
          <h2>Learning Space</h2>
          <p>
            {isMentor 
              ? `Shared notes with ${otherUser?.name}`
              : `Notes from your mentor ${otherUser?.name}`
            }
          </p>
          {!isMentor && (
            <p className={styles.viewOnlyNotice}>
              📖 View-only mode - Only your mentor can create and edit notes
            </p>
          )}
        </div>
        {isMentor && (
          <button
            className={styles.createBtn}
            onClick={() => setShowCreateModal(true)}
          >
            <PlusIcon size={20} />
            Create Note
          </button>
        )}
      </div>

      <div className={styles.filters}>
        <div className={styles.searchBar}>
          <SearchIcon size={20} />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className={styles.tagFilters}>
          {TAG_OPTIONS.map(tag => (
            <button
              key={tag}
              className={`${styles.tagFilter} ${
                selectedTags.includes(tag) ? styles.active : ''
              }`}
              onClick={() => toggleFilterTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.notesGrid}>
        {filteredNotes.length === 0 ? (
          <div className={styles.emptyState}>
            <FileIcon size={64} />
            <p>{isMentor ? 'No notes yet' : 'Your mentor has not created any notes yet'}</p>
            {isMentor && (
              <button
                className={styles.createBtn}
                onClick={() => setShowCreateModal(true)}
              >
                Create your first note
              </button>
            )}
          </div>
        ) : (
          filteredNotes.map(note => (
            <div
              key={note.id}
              className={`${styles.noteCard} ${
                note.isPinned ? styles.pinned : ''
              }`}
            >
              <div className={styles.noteHeader}>
                <h3>{note.title}</h3>
                <div className={styles.noteActions}>
                  <button
                    className={styles.iconBtn}
                    onClick={() => openViewModal(note)}
                    title="View Full Note"
                  >
                    <EyeIcon size={18} />
                  </button>
                  {isMentor && (
                    <>
                      <button
                        className={styles.iconBtn}
                        onClick={() => handlePinToggle(note)}
                        title={note.isPinned ? 'Unpin' : 'Pin'}
                      >
                        <PinIcon
                          size={18}
                          className={note.isPinned ? styles.pinned : ''}
                        />
                      </button>
                      <button
                        className={styles.iconBtn}
                        onClick={() => openEditModal(note)}
                        title="Edit"
                      >
                        <EditIcon size={18} />
                      </button>
                      <button
                        className={styles.iconBtn}
                        onClick={() => handleDeleteNote(note.id)}
                        title="Delete"
                      >
                        <TrashIcon size={18} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <p className={styles.noteContentPreview}>{note.content}</p>

              {note.tags.length > 0 && (
                <div className={styles.noteTags}>
                  {note.tags.map(tag => (
                    <span
                      key={tag}
                      className={styles.tag}
                      style={{ backgroundColor: TAG_COLORS[tag] }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {note.fileUrl && (
                <a
                  href={note.fileUrl}
                  download={note.fileName}
                  className={styles.fileAttachment}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FileIcon size={20} />
                  <span>{note.fileName}</span>
                  <DownloadIcon size={18} />
                </a>
              )}

              <div className={styles.noteFooter}>
                <span className={styles.creator}>
                  {note.creator.name}
                </span>
                <span className={styles.timestamp}>
                  {new Date(note.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {viewingNote && (
        <div className={styles.modal} onClick={closeModal}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h3>{viewingNote.title}</h3>
              <button className={styles.closeBtn} onClick={closeModal}>
                <XIcon size={24} />
              </button>
            </div>

            <div className={styles.viewModalBody}>
              <p className={styles.viewNoteContent}>{viewingNote.content}</p>

              {viewingNote.tags.length > 0 && (
                <div className={styles.noteTags}>
                  {viewingNote.tags.map(tag => (
                    <span
                      key={tag}
                      className={styles.tag}
                      style={{ backgroundColor: TAG_COLORS[tag] }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {viewingNote.fileUrl && (
                <a
                  href={viewingNote.fileUrl}
                  download={viewingNote.fileName}
                  className={styles.fileAttachment}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FileIcon size={20} />
                  <span>{viewingNote.fileName}</span>
                  <DownloadIcon size={18} />
                </a>
              )}

              <div className={styles.viewNoteFooter}>
                <span className={styles.creator}>
                  Created by {viewingNote.creator.name}
                </span>
                <span className={styles.timestamp}>
                  {new Date(viewingNote.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {(showCreateModal || editingNote) && isMentor && (
        <div className={styles.modal} onClick={closeModal}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h3>{editingNote ? 'Edit Note' : 'Create New Note'}</h3>
              <button className={styles.closeBtn} onClick={closeModal}>
                <XIcon size={24} />
              </button>
            </div>

            <form onSubmit={editingNote ? handleUpdateNote : handleCreateNote}>
              <div className={styles.formGroup}>
                <label>Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Enter note title..."
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Content *</label>
                <textarea
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  placeholder="Write your note content..."
                  rows={6}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Tags</label>
                <div className={styles.tagSelector}>
                  {TAG_OPTIONS.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      className={`${styles.tagOption} ${
                        formData.tags.includes(tag) ? styles.selected : ''
                      }`}
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {!editingNote && (
                <div className={styles.formGroup}>
                  <label>Attach File (Optional)</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.zip"
                  />
                  {formData.file && (
                    <p className={styles.fileInfo}>
                      Selected: {formData.file.name}
                    </p>
                  )}
                </div>
              )}

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={submitting}
                >
                  <SaveIcon size={18} />
                  {submitting ? 'Saving...' : (editingNote ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}