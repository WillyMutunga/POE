import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { 
  Search, 
  User, 
  BookOpen, 
  FileText, 
  ArrowRight,
  Loader2,
  GraduationCap,
  Building
} from 'lucide-react';

const SearchResults = () => {
  const { user } = useAuth();
  const [results, setResults] = useState({ users: [], units: [], portfolios: [], courses: [] });
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const query = new URLSearchParams(location.search).get('q') || '';

  useEffect(() => {
    const fetchResults = async () => {
      if (!query) return;
      setLoading(true);
      try {
        // Simple client-side search simulation by fetching all and filtering, 
        // or we could add a backend global search endpoint.
        // For now, let's fetch key data in parallel.
        const [usersRes, unitsRes, portfoliosRes, coursesRes] = await Promise.all([
          api.get('/users/list-all/'),
          api.get('/academic/units/'),
          api.get('/poe/portfolios/'),
          api.get('/academic/courses/')
        ]);

        const q = query.toLowerCase();
        
        setResults({
          users: usersRes.data.filter(u => 
            u.username.toLowerCase().includes(q) || 
            u.email.toLowerCase().includes(q) || 
            (u.registration_number && u.registration_number.toLowerCase().includes(q))
          ),
          units: unitsRes.data.filter(u => 
            u.name.toLowerCase().includes(q) || 
            u.code.toLowerCase().includes(q)
          ),
          portfolios: portfoliosRes.data.filter(p => 
            p.title.toLowerCase().includes(q) || 
            p.learner_display.toLowerCase().includes(q)
          ),
          courses: coursesRes.data.filter(c => 
            c.name.toLowerCase().includes(q)
          )
        });
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <Loader2 className="animate-spin text-[#0000FE]" size={40} />
      <p className="text-slate-500 font-bold">Searching institutional records...</p>
    </div>
  );

  const totalResults = results.users.length + results.units.length + results.portfolios.length + results.courses.length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Search Results</h1>
        <p className="text-slate-500 font-medium">Found {totalResults} matches for "{query}"</p>
      </div>

      {totalResults === 0 ? (
        <div className="p-20 text-center bg-white rounded-[40px] border border-slate-100 shadow-sm">
          <Search className="mx-auto text-slate-200 mb-6" size={64} />
          <h3 className="text-2xl font-bold text-slate-800 mb-2">No Matches Found</h3>
          <p className="text-slate-400">Try adjusting your search terms or checking for typos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Users Section */}
          {results.users.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">People & Users</h3>
              <div className="space-y-2">
                {results.users.map(u => {
                  const userLink = user.role === 'ADMIN' ? '/admin/users' : (user.role === 'INSTRUCTOR' ? '/instructor/students' : '#');
                  return (
                    <Link key={u.id} to={userLink} className={`flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 hover:shadow-md transition-all group ${userLink === '#' ? 'cursor-default' : ''}`}>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-[#0000FE]">
                          <User size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{u.username}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{u.role} | {u.registration_number || 'Staff'}</p>
                        </div>
                      </div>
                      {userLink !== '#' && <ArrowRight size={18} className="text-slate-200 group-hover:text-[#0000FE] transition-colors" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Courses Section */}
          {results.courses.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">Courses</h3>
              <div className="space-y-2">
                {results.courses.map(c => {
                  const courseLink = user.role === 'ADMIN' ? '/admin/academic' : (user.role === 'STUDENT' ? '/units' : '/units-assigned');
                  return (
                    <Link key={c.id} to={courseLink} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 hover:shadow-md transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                          <GraduationCap size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{c.name}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{c.level_display}</p>
                        </div>
                      </div>
                      <ArrowRight size={18} className="text-slate-200 group-hover:text-purple-600 transition-colors" />
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Units Section */}
          {results.units.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">Units of Learning</h3>
              <div className="space-y-2">
                {results.units.map(u => {
                  const unitLink = user.role === 'ADMIN' ? '/admin/academic' : (user.role === 'STUDENT' ? '/units' : '/units-assigned');
                  return (
                    <Link key={u.id} to={unitLink} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 hover:shadow-md transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                          <Building size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{u.name}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{u.code}</p>
                        </div>
                      </div>
                      <ArrowRight size={18} className="text-slate-200 group-hover:text-emerald-600 transition-colors" />
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Portfolios Section */}
          {results.portfolios.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">Portfolios & Submissions</h3>
              <div className="space-y-2">
                {results.portfolios.map(p => {
                  const portfolioLink = user.role === 'STUDENT' ? `/portfolios/${p.id}` : `/evaluation/${p.id}`;
                  return (
                    <Link key={p.id} to={portfolioLink} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 hover:shadow-md transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600">
                          <FileText size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{p.title}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Student: {p.learner_display}</p>
                        </div>
                      </div>
                      <ArrowRight size={18} className="text-slate-200 group-hover:text-red-600 transition-colors" />
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchResults;
