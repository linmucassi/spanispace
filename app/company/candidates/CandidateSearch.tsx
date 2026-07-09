'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, MapPin, CheckCircle, X, MessageSquare } from 'lucide-react';

interface Candidate {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  whatsapp: string | null;
  location: string | null;
  skills: string[];
  portfolio_url: string | null;
  cv_url: string | null;
  verified: boolean;
  profile_score: number | null;
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null || score === undefined) return null;

  let color = 'bg-slate-100 text-slate-600';
  if (score >= 80) color = 'bg-green-100 text-green-700';
  else if (score >= 60) color = 'bg-blue-100 text-blue-700';
  else if (score >= 40) color = 'bg-amber-100 text-amber-700';

  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${color}`}>
      {score}%
    </span>
  );
}

export default function CandidateSearch({
  initialCandidates,
}: {
  initialCandidates: Candidate[];
}) {
  const [searchSkills, setSearchSkills] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  const filtered = initialCandidates.filter((c) => {
    const skillMatch =
      !searchSkills ||
      c.skills?.some((skill) =>
        skill.toLowerCase().includes(searchSkills.toLowerCase())
      ) ||
      c.full_name.toLowerCase().includes(searchSkills.toLowerCase());

    const locationMatch =
      !searchLocation ||
      (c.location &&
        c.location.toLowerCase().includes(searchLocation.toLowerCase()));

    return skillMatch && locationMatch;
  });

  return (
    <>
      {/* Search Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by skills or name..."
            value={searchSkills}
            onChange={(e) => setSearchSkills(e.target.value)}
            className="block w-full rounded-xl border border-slate-200 pl-10 pr-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
          />
        </div>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Filter by location..."
            value={searchLocation}
            onChange={(e) => setSearchLocation(e.target.value)}
            className="block w-full rounded-xl border border-slate-200 pl-10 pr-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
          />
        </div>
      </div>

      {/* Results Count */}
      <p className="text-sm text-slate-500 mb-4">
        {filtered.length} candidate{filtered.length !== 1 ? 's' : ''} found
      </p>

      {/* Candidate Cards */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-16 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <Search className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            No candidates found
          </h3>
          <p className="text-sm text-slate-500">
            Try adjusting your search filters to find matching candidates.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((candidate) => (
            <div
              key={candidate.id}
              onClick={() => setSelectedCandidate(candidate)}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 truncate">
                      {candidate.full_name}
                    </h3>
                    {candidate.verified && (
                      <CheckCircle className="w-4 h-4 text-indigo-600 shrink-0" />
                    )}
                  </div>
                  {candidate.location && (
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" />
                      {candidate.location}
                    </p>
                  )}
                </div>
                <ScoreBadge score={candidate.profile_score} />
              </div>

              {/* Skills */}
              {candidate.skills && candidate.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {candidate.skills.slice(0, 5).map((skill, idx) => (
                    <span
                      key={idx}
                      className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 text-xs font-medium text-slate-600"
                    >
                      {skill}
                    </span>
                  ))}
                  {candidate.skills.length > 5 && (
                    <span className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 text-xs font-medium text-slate-400">
                      +{candidate.skills.length - 5} more
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Candidate Detail Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">
                Candidate Profile
              </h2>
              <button
                onClick={() => setSelectedCandidate(null)}
                className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-lg font-bold text-indigo-600">
                    {selectedCandidate.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900">
                      {selectedCandidate.full_name}
                    </h3>
                    {selectedCandidate.verified && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                        <CheckCircle className="w-3 h-3" />
                        Verified
                      </span>
                    )}
                  </div>
                  {selectedCandidate.location && (
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {selectedCandidate.location}
                    </p>
                  )}
                </div>
              </div>

              {selectedCandidate.profile_score !== null && (
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase">
                    Profile Score
                  </span>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="flex-1 bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${selectedCandidate.profile_score}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-bold text-slate-700">
                      {selectedCandidate.profile_score}%
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase">
                    Phone
                  </span>
                  <p className="text-slate-900">{selectedCandidate.phone || '-'}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase">
                    WhatsApp
                  </span>
                  <p className="text-slate-900">
                    {selectedCandidate.whatsapp || '-'}
                  </p>
                </div>
              </div>

              {selectedCandidate.skills &&
                selectedCandidate.skills.length > 0 && (
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase">
                      Skills
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {selectedCandidate.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="inline-flex px-2.5 py-1 rounded-md bg-slate-100 text-xs font-medium text-slate-700"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              <div className="flex gap-3 pt-2">
                <Link
                  href={`/company/messages?candidateId=${selectedCandidate.id}`}
                  className="inline-flex items-center gap-1.5 text-sm text-indigo-600 font-medium hover:underline"
                >
                  <MessageSquare className="w-4 h-4" />
                  Message
                </Link>
                {selectedCandidate.portfolio_url && (
                  <a
                    href={selectedCandidate.portfolio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-indigo-600 font-medium hover:underline"
                  >
                    View Portfolio
                  </a>
                )}
                {selectedCandidate.cv_url && (
                  <a
                    href={selectedCandidate.cv_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-indigo-600 font-medium hover:underline"
                  >
                    Download CV
                  </a>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100">
              <button
                onClick={() => setSelectedCandidate(null)}
                className="w-full bg-slate-100 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
