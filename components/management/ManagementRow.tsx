'use client';

import { useId, useState, type ReactNode } from 'react';
import styles from './management.module.css';

export default function ManagementRow({ name, cells, editor }: {
  name: string;
  cells: ReactNode[];
  editor?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <>
      <tr>
        <th scope="row">{name}</th>
        {cells.map((cell, index) => <td key={index}>{cell}</td>)}
        <td className={styles.actionCell}>
          <div className={styles.actions}>
            {editor && (
              <button type="button" className="button-secondary" aria-label={`${open ? 'Close editor for' : 'Edit'} ${name}`}
                aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
                {open ? 'Close' : 'Edit'}
              </button>
            )}
          </div>
        </td>
      </tr>
      {editor && (
        <tr className={styles.editorRow} hidden={!open}>
          <td colSpan={cells.length + 2}>
            <div id={id} className={styles.editorPanel}>
              {open && editor}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
