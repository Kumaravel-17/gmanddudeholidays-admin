'use client';

import { useState } from 'react';
import { ArrowDown, ArrowUp, Pencil, Trash2 } from 'lucide-react';
import { newId, useStore } from '../../lib/store';
import { Faq } from '../../lib/types';
import { AddButton, confirmDelete, Empty, Field, FormModal, PageHeader } from '../ui';

export default function Faqs() {
  const { data, upsert, remove, setData } = useStore();
  const [editing, setEditing] = useState<Faq | null>(null);

  const move = (index: number, by: number) =>
    setData((d) => {
      const faqs = d.faqs.slice();
      const [item] = faqs.splice(index, 1);
      faqs.splice(index + by, 0, item);
      return { ...d, faqs };
    });

  return (
    <>
      <PageHeader
        title="FAQs"
        subtitle={`"Got Questions? We've Got Answers." on the home page, in this order.`}
        action={<AddButton label="Add question" onClick={() => setEditing({ id: '', question: '', answer: '' })} />}
      />

      {data.faqs.length === 0 ? (
        <Empty text="No questions yet." />
      ) : (
        <div className="faq-list">
          {data.faqs.map((f, i) => (
            <div key={f.id} className="faq-item">
              <span className="faq-num">{String(i + 1).padStart(2, '0')}</span>
              <div className="faq-text">
                <div className="strong">{f.question}</div>
                <p className="muted">{f.answer}</p>
              </div>
              <div className="row-actions">
                <button className="icon-btn" disabled={i === 0} onClick={() => move(i, -1)} title="Move up">
                  <ArrowUp size={15} />
                </button>
                <button className="icon-btn" disabled={i === data.faqs.length - 1} onClick={() => move(i, 1)} title="Move down">
                  <ArrowDown size={15} />
                </button>
                <button className="icon-btn" onClick={() => setEditing(f)} title="Edit">
                  <Pencil size={15} />
                </button>
                <button className="icon-btn icon-btn-danger" onClick={() => confirmDelete('this question') && remove('faqs', f.id)} title="Delete">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <FaqForm
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={(f) => {
            upsert('faqs', f.id ? f : { ...f, id: newId('FAQ') });
            setEditing(null);
          }}
        />
      )}
    </>
  );
}

function FaqForm({ initial, onClose, onSave }: { initial: Faq; onClose: () => void; onSave: (f: Faq) => void }) {
  const [f, setF] = useState(initial);
  return (
    <FormModal title={initial.id ? 'Edit question' : 'Add question'} onClose={onClose} onSave={() => onSave(f)}>
      <Field label="Question" full>
        <input className="input" required value={f.question} onChange={(e) => setF({ ...f, question: e.target.value })} />
      </Field>
      <Field label="Answer" full>
        <textarea className="input" rows={5} required value={f.answer} onChange={(e) => setF({ ...f, answer: e.target.value })} />
      </Field>
    </FormModal>
  );
}
