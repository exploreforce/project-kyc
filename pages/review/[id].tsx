import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

interface EmailResponse {
  id: number;
  draft_subject: string;
  draft_body: string;
  attached_documents: string[];
  original_email: {
    from_email: string;
    subject: string;
    body: string;
  };
  documents: Array<{
    id: string;
    filename: string;
    summary: string;
  }>;
}

export default function ReviewEmail() {
  const router = useRouter();
  const { id } = router.query;
  const [response, setResponse] = useState<EmailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [editedBody, setEditedBody] = useState('');

  useEffect(() => {
    if (id) {
      fetchEmailResponse();
    }
  }, [id]);

  const fetchEmailResponse = async () => {
    try {
      const res = await fetch(`/api/emails/${id}/response`);
      const data = await res.json();
      setResponse(data);
      setEditedBody(data.draft_body);
    } catch (error) {
      console.error('Failed to fetch email response:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setSending(true);
    try {
      await fetch(`/api/emails/${id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: response?.draft_subject,
          body: editedBody,
          attachments: response?.attached_documents
        })
      });
      
      alert('E-Mail erfolgreich gesendet!');
      router.push('/');
    } catch (error) {
      alert('Fehler beim Senden der E-Mail');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Lade...</div>;
  }

  if (!response) {
    return <div className="min-h-screen flex items-center justify-center">E-Mail nicht gefunden</div>;
  }

  return (
    <>
      <Head>
        <title>E-Mail Review - KYC Manager</title>
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-6">
            <button
              onClick={() => router.push('/')}
              className="text-blue-600 hover:text-blue-800"
            >
              ← Zurück zum Dashboard
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Original Email */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Original E-Mail</h2>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="mb-4">
                  <div className="text-sm text-gray-500">Von:</div>
                  <div className="font-medium">{response.original_email.from_email}</div>
                </div>
                <div className="mb-4">
                  <div className="text-sm text-gray-500">Betreff:</div>
                  <div className="font-medium">{response.original_email.subject}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-2">Nachricht:</div>
                  <div className="whitespace-pre-wrap bg-gray-50 p-4 rounded">
                    {response.original_email.body}
                  </div>
                </div>
              </div>
            </div>

            {/* Draft Response */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Antwort-Entwurf</h2>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Betreff:
                  </label>
                  <input
                    type="text"
                    value={response.draft_subject}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nachricht:
                  </label>
                  <textarea
                    value={editedBody}
                    onChange={(e) => setEditedBody(e.target.value)}
                    rows={12}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Angehängte Dokumente ({response.documents.length}):
                  </h3>
                  <ul className="space-y-2">
                    {response.documents.map(doc => (
                      <li key={doc.id} className="flex items-start">
                        <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <div className="font-medium">{doc.filename}</div>
                          <div className="text-sm text-gray-500">{doc.summary}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handleApprove}
                    disabled={sending}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? 'Wird gesendet...' : 'E-Mail senden'}
                  </button>
                  <button
                    onClick={() => router.push('/')}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 