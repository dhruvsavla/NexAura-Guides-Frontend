// src/components/GuideCard.js
import React, { useState } from 'react';
import '../../styles/components/GuideCard.css'; // Make sure this path matches your setup

const GuideCard = ({
  guide,
  showDelete = false,
  onDelete,
  showDownload = false,
  onDownload,
  isOwner = false,
  onShare,
  onEdit,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  const copyShortcut = async (e) => {
    e.stopPropagation();
    if (!guide?.shortcut) return;
    try {
      await navigator.clipboard.writeText(guide.shortcut);
      setCopied(true);
      setToastVisible(true);
      setTimeout(() => {
        setCopied(false);
        setToastVisible(false);
      }, 1400);
    } catch (err) {
      console.warn('Clipboard copy failed', err);
    }
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (!onDelete) return;
    setConfirmOpen(true);
  };

  const handleDownloadClick = (e) => {
    e.stopPropagation();
    if (!onDownload) return;
    onDownload(guide);
  };

  const handleShareClick = (e) => {
    e.stopPropagation();
    if (!onShare) return;
    onShare(guide);
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    if (!onEdit) return;
    onEdit(guide);
  };

  const hasActions = showDelete || showDownload || (isOwner && onShare) || (isOwner && onEdit);

  const renderBadge = () => {
    if (guide.is_public) {
      return <div className="guide-badge public">Public</div>;
    }
    if (guide.shared_emails && guide.shared_emails.length > 0) {
      return <div className="guide-badge shared">Shared</div>;
    }
    return <div className="guide-badge private">Private</div>;
  };

  return (
    <div
      className={`guide-card ${isExpanded ? 'expanded' : ''}`}
      onClick={() => {
        if (!hasActions) setIsExpanded((prev) => !prev);
      }}
      style={{ cursor: hasActions ? 'default' : 'pointer' }}
    >
      {renderBadge()}
      <h3 className="guide-card-title">{guide.name}</h3>
      <p
        className="guide-card-shortcut"
        onClick={copyShortcut}
        title="Click to copy shortcut"
      >
        {guide.shortcut}
        {copied && <span className="copied-dot" aria-label="Copied">•</span>}
      </p>
      <p className="guide-card-description">{guide.description}</p>
      <span className="guide-card-steps">
        {guide.steps.length} {guide.steps.length === 1 ? 'Step' : 'Steps'}
      </span>

      {hasActions && (
        <div className="guide-card-actions">
          
          {/* EXPAND STEPS (Arrow) */}
          {/* EXPAND STEPS */}
          <button
            className="icon-btn expand-btn"
            title={isExpanded ? "Hide Steps" : "Show Steps"}
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded((prev) => !prev);
            }}
          >
            <svg className="icon expand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>

          {/* DOWNLOAD */}
          {showDownload && (
            <button
              className="icon-btn download-btn"
              title="Download PDF"
              onClick={handleDownloadClick}
            >
              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </button>
          )}

          {/* EDIT */}
          {isOwner && onEdit && (
            <button
              className="icon-btn edit-btn"
              title="Edit Guide"
              onClick={handleEditClick}
            >
              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
          )}

          {/* SHARE */}
          {isOwner && onShare && (
            <button
              className="icon-btn share-btn"
              title="Share Guide"
              onClick={handleShareClick}
            >
              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"></circle>
                <circle cx="6" cy="12" r="3"></circle>
                <circle cx="18" cy="19" r="3"></circle>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
              </svg>
            </button>
          )}

          {/* DELETE */}
          {showDelete && isOwner && (
            <button
              className="icon-btn delete-btn"
              title="Delete Guide"
              onClick={handleDeleteClick}
            >
              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Expanded Steps List */}
      {isExpanded && (
        <div className="guide-card-steps-list">
          <h4>Guide Steps:</h4>
          <ol>
            {guide.steps.map((step, index) => (
              <li key={index}>{step.instruction}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmOpen && (
        <div className="guide-card-confirm" role="dialog" aria-modal="true">
          <div className="confirm-body">
            <p>Delete “<strong>{guide.name}</strong>”?</p>
            <div className="confirm-actions">
              <button className="confirm-cancel" onClick={(e) => { e.stopPropagation(); setConfirmOpen(false); }}>Keep it</button>
              <button className="confirm-delete" onClick={(e) => { e.stopPropagation(); setConfirmOpen(false); onDelete && onDelete(guide.id); }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {toastVisible && <div className="copy-toast" role="status" aria-live="polite">Guide shortcut copied</div>}
    </div>
  );
};

export default GuideCard;