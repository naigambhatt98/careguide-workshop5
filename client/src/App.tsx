import { type Dispatch, type FormEvent, type SetStateAction, useEffect, useState } from 'react';
import { BrowserRouter, Link, NavLink, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { demoGuides } from './data/demoGuides';
import { deleteGuide, generateGuide, updateChecklist } from './lib/api';
import type { CareGuide, GenerateGuidePayload } from './types';

const STORAGE_KEY = 'careguide-guides';

function getInitialGuides(): CareGuide[] {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved) as CareGuide[];
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      return demoGuides;
    }
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(demoGuides));
  return demoGuides;
}

function AppShell() {
  const [guides, setGuides] = useState<CareGuide[]>(getInitialGuides);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(guides));
  }, [guides]);

  const removeGuide = async (id: string) => {
    try {
      await deleteGuide(id);
    } catch {
      // Ignore backend delete errors for local-only persistence fallback.
    }

    setGuides((current) => current.filter((guide) => guide.id !== id));
  };

  return (
    <BrowserRouter>
      <div className="app-shell">
        <header className="topbar">
          <div className="container nav-row">
            <Link to="/" className="brand">CareGuide</Link>
            <nav className="nav" aria-label="Main navigation">
              <NavLink to="/" end>
                Home
              </NavLink>
              <NavLink to="/new">New Guide</NavLink>
              <NavLink to="/guides">My Guides</NavLink>
            </nav>
          </div>
        </header>

        <main>
          <Routes>
            <Route path="/" element={<HomePage guides={guides} />} />
            <Route
              path="/new"
              element={<NewGuidePage guides={guides} setGuides={setGuides} />}
            />
            <Route
              path="/guides"
              element={<MyGuidesPage guides={guides} onDelete={removeGuide} />}
            />
            <Route
              path="/guides/:id"
              element={<GuideDetailPage guides={guides} setGuides={setGuides} />}
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

function HomePage({ guides }: { guides: CareGuide[] }) {
  const recentGuides = guides.slice(0, 3);

  return (
    <div className="container page-area">
      <section className="hero card">
        <div>
          <p className="eyebrow">Patient preparation support</p>
          <h1>CareGuide</h1>
          <p className="subtitle">Prepare for your healthcare visit with clarity and confidence.</p>
          <p className="hero-copy">
            Organize appointment instructions, create a preparation checklist, and prepare questions for your healthcare team.
          </p>
          <div className="cta-row">
            <Link to="/new" className="button primary">
              Create Preparation Guide
            </Link>
            <Link to="/guides" className="button secondary">
              View My Guides
            </Link>
          </div>
          <p className="safety-note">
            CareGuide supports appointment preparation and does not replace medical advice from your healthcare professional.
          </p>
        </div>
      </section>

      <section className="feature-grid">
        <div className="mini-card">
          <h3>Clear preparation steps</h3>
          <p>Turn long clinic notes into organized, plain-language guidance.</p>
        </div>
        <div className="mini-card">
          <h3>Questions to ask</h3>
          <p>Review general questions tailored to your appointment type.</p>
        </div>
        <div className="mini-card">
          <h3>Organized checklist</h3>
          <p>Keep track of what you need to bring and what you need to confirm.</p>
        </div>
        <div className="mini-card">
          <h3>AI-assisted explanation</h3>
          <p>Use simple summaries while keeping provider instructions clearly visible.</p>
        </div>
      </section>

      <section className="section-header">
        <div>
          <p className="eyebrow">Recent guides</p>
          <h2>Upcoming / Recent Guides</h2>
        </div>
        <Link to="/guides" className="text-link">
          View all guides
        </Link>
      </section>

      {recentGuides.length === 0 ? (
        <div className="empty-card card">
          <p>You haven&apos;t created any preparation guides yet.</p>
        </div>
      ) : (
        <div className="guide-list">
          {recentGuides.map((guide) => {
            const completedCount = guide.checklist.filter((item) => item.completed).length;
            const progress = `${completedCount}/${guide.checklist.length}`;

            return (
              <div key={guide.id} className="guide-card card">
                <div>
                  <p className="small-label">{guide.appointmentType}</p>
                  <h3>{guide.facilityName}</h3>
                </div>
                <div className="meta-grid">
                  <span>{guide.appointmentDate}</span>
                  <span>{guide.appointmentTime}</span>
                  <span>Checklist: {progress}</span>
                </div>
                <Link to={`/guides/${guide.id}`} className="button tertiary">
                  Open guide
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NewGuidePage({
  setGuides,
}: {
  guides?: CareGuide[];
  setGuides: Dispatch<SetStateAction<CareGuide[]>>;
}) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<GenerateGuidePayload>({
    appointmentType: 'Primary Care Visit',
    appointmentDate: '',
    appointmentTime: '',
    facilityName: '',
    providerName: '',
    reasonForVisit: '',
    officialInstructions: '',
    additionalNotes: '',
  });

  const handleChange = (field: keyof GenerateGuidePayload, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await generateGuide(form);
      setGuides((current) => [result, ...current]);
      navigate(`/guides/${result.id}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'We could not create your guide. Please review the highlighted fields and try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container page-area">
      <div className="section-header stacked-header">
        <div>
          <p className="eyebrow">New preparation guide</p>
          <h2>Your Preparation Guide</h2>
        </div>
      </div>

      <form className="card form-card" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="field-group">
            <label htmlFor="appointmentType">Appointment / Procedure Type</label>
            <select
              id="appointmentType"
              value={form.appointmentType}
              onChange={(event) => handleChange('appointmentType', event.target.value)}
            >
              <option>Primary Care Visit</option>
              <option>Specialist Consultation</option>
              <option>Blood Test</option>
              <option>MRI</option>
              <option>CT Scan</option>
              <option>Ultrasound</option>
              <option>Routine Screening</option>
              <option>Follow-Up Visit</option>
              <option>Other</option>
            </select>
          </div>

          <div className="field-group">
            <label htmlFor="appointmentDate">Appointment Date</label>
            <input
              id="appointmentDate"
              type="date"
              value={form.appointmentDate}
              onChange={(event) => handleChange('appointmentDate', event.target.value)}
              required
            />
          </div>

          <div className="field-group">
            <label htmlFor="appointmentTime">Appointment Time</label>
            <input
              id="appointmentTime"
              type="time"
              value={form.appointmentTime}
              onChange={(event) => handleChange('appointmentTime', event.target.value)}
            />
          </div>

          <div className="field-group">
            <label htmlFor="facilityName">Facility / Clinic Name</label>
            <input
              id="facilityName"
              type="text"
              value={form.facilityName}
              onChange={(event) => handleChange('facilityName', event.target.value)}
              placeholder="Example Family Clinic"
              required
            />
          </div>

          <div className="field-group">
            <label htmlFor="providerName">Optional Provider Name</label>
            <input
              id="providerName"
              type="text"
              value={form.providerName}
              onChange={(event) => handleChange('providerName', event.target.value)}
              placeholder="Dr. Smith"
            />
          </div>

          <div className="field-group full-width">
            <label htmlFor="reasonForVisit">Reason for Visit</label>
            <textarea
              id="reasonForVisit"
              value={form.reasonForVisit}
              onChange={(event) => handleChange('reasonForVisit', event.target.value)}
              rows={3}
              placeholder="Describe the purpose of the appointment or procedure."
              required
            />
          </div>

          <div className="field-group full-width">
            <label htmlFor="officialInstructions">Official Preparation Instructions</label>
            <textarea
              id="officialInstructions"
              value={form.officialInstructions}
              onChange={(event) => handleChange('officialInstructions', event.target.value)}
              rows={5}
              placeholder="Paste the clinic's instructions, fasting guidance, time requirements, or arrival details here."
            />
          </div>

          <div className="field-group full-width">
            <label htmlFor="additionalNotes">Additional Notes</label>
            <textarea
              id="additionalNotes"
              value={form.additionalNotes}
              onChange={(event) => handleChange('additionalNotes', event.target.value)}
              rows={3}
              placeholder="Include any relevant notes or questions to discuss with your provider."
            />
          </div>
        </div>

        {error ? <div className="error-box" role="alert">{error}</div> : null}

        <div className="form-actions">
          <button type="submit" className="button primary" disabled={loading}>
            {loading ? 'Preparing your guide...' : 'Create My Preparation Guide'}
          </button>
        </div>
      </form>
    </div>
  );
}

function MyGuidesPage({ guides, onDelete }: { guides: CareGuide[]; onDelete: (id: string) => Promise<void> | void }) {
  return (
    <div className="container page-area">
      <div className="section-header">
        <div>
          <p className="eyebrow">Saved guides</p>
          <h2>My Guides</h2>
        </div>
        <Link to="/new" className="button secondary small">
          Start new guide
        </Link>
      </div>

      {guides.length === 0 ? (
        <div className="empty-card card">
          <p>You haven&apos;t created any preparation guides yet.</p>
        </div>
      ) : (
        <div className="table-card card">
          <table>
            <thead>
              <tr>
                <th>Appointment type</th>
                <th>Date</th>
                <th>Facility</th>
                <th>Checklist progress</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {guides.map((guide) => {
                const completedCount = guide.checklist.filter((item) => item.completed).length;
                const progress = `${completedCount}/${guide.checklist.length}`;

                return (
                  <tr key={guide.id}>
                    <td>{guide.appointmentType}</td>
                    <td>{guide.appointmentDate}</td>
                    <td>{guide.facilityName}</td>
                    <td>{progress}</td>
                    <td>{new Date(guide.createdAt).toLocaleDateString()}</td>
                    <td className="action-cell">
                      <Link to={`/guides/${guide.id}`} className="table-link">
                        View
                      </Link>
                      <button className="table-button" type="button" onClick={() => onDelete(guide.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function GuideDetailPage({
  guides,
  setGuides,
}: {
  guides: CareGuide[];
  setGuides: Dispatch<SetStateAction<CareGuide[]>>;
}) {
  const { id } = useParams();
  const guide = guides.find((entry) => entry.id === id);

  if (!guide) {
    return (
      <div className="container page-area">
        <div className="empty-card card">
          <p>We could not find that preparation guide.</p>
          <Link to="/guides" className="button secondary small">
            Back to My Guides
          </Link>
        </div>
      </div>
    );
  }

  const completedCount = guide.checklist.filter((item) => item.completed).length;
  const checklistProgress = `${completedCount}/${guide.checklist.length}`;

  const onChecklistToggle = async (itemId: string, checked: boolean) => {
    const updatedChecklist = guide.checklist.map((item) =>
      item.id === itemId ? { ...item, completed: !checked } : item,
    );

    setGuides((current) =>
      current.map((entry) =>
        entry.id === guide.id ? { ...entry, checklist: updatedChecklist, updatedAt: new Date().toISOString() } : entry,
      ),
    );

    try {
      await updateChecklist(guide.id, itemId, !checked);
    } catch {
      // Keep the local state so a user can continue working even when the backend is unavailable.
    }
  };

  return (
    <div className="container page-area guide-detail">
      <div className="section-header">
        <div>
          <p className="eyebrow">Preparation guide</p>
          <h2>{guide.appointmentType}</h2>
        </div>
        <div className="header-actions">
          <button type="button" className="button secondary small" onClick={() => window.print()}>
            Print guide
          </button>
          <Link to="/new" className="button primary small">
            Start new guide
          </Link>
        </div>
      </div>

      <div className="summary-card card">
        <h3>Your CareGuide</h3>
        <div className="summary-grid">
          <div>
            <p className="meta-label">Appointment type</p>
            <strong>{guide.appointmentType}</strong>
          </div>
          <div>
            <p className="meta-label">Date</p>
            <strong>{guide.appointmentDate}</strong>
          </div>
          <div>
            <p className="meta-label">Time</p>
            <strong>{guide.appointmentTime}</strong>
          </div>
          <div>
            <p className="meta-label">Facility</p>
            <strong>{guide.facilityName}</strong>
          </div>
          <div>
            <p className="meta-label">Provider</p>
            <strong>{guide.providerName}</strong>
          </div>
          <div>
            <p className="meta-label">Checklist progress</p>
            <strong>{checklistProgress}</strong>
          </div>
        </div>
      </div>

      <div className="guide-two-column">
        <div>
          <section className="info-card card">
            <h3>Instructions from Your Healthcare Provider</h3>
            <p>{guide.officialInstructions}</p>
          </section>

          <section className="info-card card">
            <h3>AI-assisted summary</h3>
            <p>{guide.generatedSummary}</p>
          </section>

          <section className="info-card card">
            <h3>Before Your Appointment</h3>
            <ul>
              {guide.importantReminders.map((reminder) => (
                <li key={reminder}>{reminder}</li>
              ))}
            </ul>
          </section>

          <section className="info-card card">
            <h3>What to Bring</h3>
            <ul>
              {guide.whatToBring.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="info-card card">
            <h3>Questions You May Want to Ask</h3>
            <ul>
              {guide.questions.map((question) => (
                <li key={question.id}>{question.text}</li>
              ))}
            </ul>
          </section>

          <section className="info-card card">
            <h3>What to Expect</h3>
            <ul>
              {guide.whatToExpect.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="sidebar-column">
          <section className="info-card card checklist-card">
            <h3>Preparation Checklist</h3>
            <ul className="checklist">
              {guide.checklist.map((item) => (
                <li key={item.id}>
                  <label className="check-item">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => onChecklistToggle(item.id, item.completed)}
                    />
                    <span>{item.text}</span>
                  </label>
                </li>
              ))}
            </ul>
          </section>

          <section className="info-card card">
            <h3>Important Safety Notice</h3>
            <p>{guide.providerPriority}</p>
            <p className="safety-line">{guide.safetyNotice}</p>
          </section>
        </aside>
      </div>
    </div>
  );
}

export default function App() {
  return <AppShell />;
}
