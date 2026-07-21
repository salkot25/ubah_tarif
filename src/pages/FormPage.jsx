import React, { useState } from 'react';
import { SurveyForm } from '../components/survey/SurveyForm';
import { useSurveyData } from '../hooks/useSurveyData';

export default function FormPage() {
  const { handleCreate } = useSurveyData();
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      return await handleCreate(data);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <h2 className="page-title">Form Survey Baru</h2>
        <p className="text-sm text-slate-500 mt-1">Lengkapi seluruh 5 tahap untuk menyimpan data survey</p>
      </div>
      <SurveyForm onSubmit={onSubmit} submitting={submitting} />
    </div>
  );
}
