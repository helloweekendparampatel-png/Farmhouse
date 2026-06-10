'use client';

import { useId } from 'react';
import { Upload } from 'lucide-react';

type FileUploadControlProps = {
  accept?: string;
  multiple?: boolean;
  /** Called with newly picked files (input is cleared after each pick so the same file can be re-added where needed). */
  onFilesPicked: (files: File[]) => void;
  prompt: string;
  hint?: string;
  className?: string;
  hasError?: boolean;
  disabled?: boolean;
  'aria-label'?: string;
};

export function FileUploadControl({
  accept = 'image/*',
  multiple = false,
  onFilesPicked,
  prompt,
  hint,
  className = '',
  hasError = false,
  disabled = false,
  'aria-label': ariaLabel,
}: FileUploadControlProps) {
  const id = useId();

  return (
    <div
      className={`file-upload${hasError ? ' file-upload--error' : ''}${className ? ` ${className}` : ''}`}
    >
      <input
        id={id}
        type="file"
        className="file-upload__input"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        aria-label={ariaLabel ?? prompt}
        onChange={(e) => {
          const list = e.target.files ? Array.from(e.target.files) : [];
          e.target.value = '';
          if (list.length) onFilesPicked(list);
        }}
      />
      <div className="file-upload__surface" aria-hidden>
        <Upload className="file-upload__icon" strokeWidth={2} />
        <span className="file-upload__prompt">{prompt}</span>
        {hint ? <span className="file-upload__hint">{hint}</span> : null}
      </div>
    </div>
  );
}
