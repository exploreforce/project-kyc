import React, { useState, useEffect } from 'react';
import Head from 'next/head';

interface Document {
  id: string;
  filename: string;
  summary: string;
  expiry_date: string | null;
  document_type: string;
}

interface EmailRequest {
  id: number;
  from_email: string;
  subject: string;
  received_at: string;
  status: string;
}

export default function Dashboard() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [emails, setEmails] = useState<EmailRequest[]>([]);
  const [expiredDocs, setExpiredDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [docsRes, emailsRes, expiredRes] = await Promise.all([
        fetch('/api/documents'),
        fetch('/api/emails'),
        fetch('/api/documents/expired')
      ]);

      // Safe parsing with fallbacks
      setDocuments(docsRes.ok ? await docsRes.json() : []);
      setEmails(emailsRes.ok ? await emailsRes.json() : []);
      setExpiredDocs(expiredRes.ok ? await expiredRes.json() : []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      // Set empty arrays on error
      setDocuments([]);
      setEmails([]);
      setExpiredDocs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessEmail = async (emailId: number) => {
    await fetch(`/api/emails/${emailId}/process`, { method: 'POST' });
    fetchData();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Lade Dashboard...</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>KYC Document Manager</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold text-gray-900">KYC Document Manager</h1>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Alerts */}
          {expiredDocs.length > 0 && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-red-800 mb-2">
                ⚠️ Abgelaufene Dokumente
              </h3>
              <ul className="space-y-1">
                {expiredDocs.map(doc => (
                  <li key={doc.id} className="text-red-700">
                    {doc.filename} - Abgelaufen am {new Date(doc.expiry_date!).toLocaleDateString('de-DE')}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Email Requests */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">E-Mail Anfragen</h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Von</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Betreff</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Erhalten</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aktion</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {emails.map(email => (
                    <tr key={email.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{email.from_email}</td>
                      <td className="px-6 py-4 text-sm">{email.subject}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {new Date(email.received_at).toLocaleString('de-DE')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          email.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          email.status === 'processed' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {email.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {email.status === 'pending' && (
                          <button
                            onClick={() => handleProcessEmail(email.id)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Bearbeiten
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Documents Overview */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Dokumente im Ordner ({documents.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map(doc => (
                <div key={doc.id} className="bg-white rounded-lg shadow p-4">
                  <h3 className="font-medium text-gray-900 mb-1">{doc.filename}</h3>
                  <p className="text-sm text-gray-600 mb-2">{doc.summary}</p>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>{doc.document_type}</span>
                    {doc.expiry_date && (
                      <span>Gültig bis: {new Date(doc.expiry_date).toLocaleDateString('de-DE')}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </>
  );
} 