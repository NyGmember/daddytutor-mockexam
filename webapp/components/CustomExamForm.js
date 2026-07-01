'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Layers, Settings, HelpCircle, Loader2, ListFilter, Clipboard } from 'lucide-react';

export default function CustomExamForm({ subjects }) {
  const router = useRouter();

  // Tab mode state: 'topics' or 'sets'
  const [activeTab, setActiveTab] = useState('topics');

  // ==========================================
  // TOPIC-BASED MODE STATES & LOGIC
  // ==========================================
  const [selectedSubjectId, setSelectedSubjectId] = useState('mathematics');
  const [selectedLevelId, setSelectedLevelId] = useState('');
  const [availableTopics, setAvailableTopics] = useState([]);
  const [selectedTopicIds, setSelectedTopicIds] = useState([]);
  const [questionCount, setQuestionCount] = useState(10);

  // UI States
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [generatingExam, setGeneratingExam] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [warningMsg, setWarningMsg] = useState('');

  // Get levels for selected subject
  const currentSubject = subjects.find(s => s.id === selectedSubjectId);
  const availableLevels = currentSubject?.levels || [];

  // Set default level when subject changes (default to lower_secondary / มัธยมต้น)
  useEffect(() => {
    if (availableLevels.length > 0) {
      const lowerSecondary = availableLevels.find(l => l.id.includes('lower_secondary'));
      setSelectedLevelId(lowerSecondary ? lowerSecondary.id : availableLevels[0].id);
    } else {
      setSelectedLevelId('');
    }
  }, [selectedSubjectId, availableLevels]);

  // Load topics dynamically when subject or level changes
  useEffect(() => {
    if (!selectedSubjectId || !selectedLevelId) {
      setAvailableTopics([]);
      setSelectedTopicIds([]);
      return;
    }

    async function fetchTopics() {
      setLoadingTopics(true);
      setErrorMsg('');
      try {
        const res = await fetch(`/api/topics?subjectId=${selectedSubjectId}&levelId=${selectedLevelId}`);
        if (res.ok) {
          const data = await res.json();
          setAvailableTopics(data);
          // By default, select all topics
          setSelectedTopicIds(data.map(t => t.id));
        } else {
          setErrorMsg('ไม่สามารถโหลดหัวข้อข้อสอบได้');
        }
      } catch (err) {
        console.error('Error fetching topics:', err);
        setErrorMsg('เกิดข้อผิดพลาดในการโหลดหัวข้อ');
      } finally {
        setLoadingTopics(false);
      }
    }

    fetchTopics();
  }, [selectedSubjectId, selectedLevelId]);

  // Toggle topic selection
  const handleToggleTopic = (topicId) => {
    setSelectedTopicIds(prev =>
      prev.includes(topicId)
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
  };

  // Group Science Topics helper
  const getGroupedScienceTopics = (topics) => {
    const groups = {
      basic: {
        name: 'พื้นฐาน',
        ids: ['basic_biology', 'basic_chemistry', 'basic_physics', 'basic_earth_astronomy_space', 'scientific_method', 'general_knowledge', 'economics_principles', 'numbers_and_algebra'],
        list: []
      },
      biology: {
        name: 'ชีววิทยา',
        ids: ['cell_processes', 'plant_physiology', 'animal_human_physiology', 'biodiversity', 'genetics_evolution'],
        list: []
      },
      chemistry: {
        name: 'เคมี',
        ids: ['chemical_bonding_gases', 'acids_bases_electrochemistry', 'atomic_structure_periodic_table', 'organic_chemistry_polymers', 'stoichiometry_equilibrium'],
        list: []
      },
      physics: {
        name: 'ฟิสิกส์',
        ids: ['electricity_magnetism', 'mechanics', 'waves_light_sound', 'matter_and_heat', 'modern_and_nuclear_physics'],
        list: []
      },
      earthSpace: {
        name: 'โลก ดาราศาสตร์และอวกาศ',
        ids: ['solar_system_space_exploration', 'astronomy_cosmology', 'georesources_maps', 'geology_earth_structure', 'atmosphere_climate', 'earth_and_space'],
        list: []
      }
    };

    topics.forEach(t => {
      let placed = false;
      for (const key in groups) {
        if (groups[key].ids.includes(t.id)) {
          groups[key].list.push(t);
          placed = true;
          break;
        }
      }
      if (!placed) {
        groups.basic.list.push(t);
      }
    });

    return Object.values(groups).filter(g => g.list.length > 0);
  };

  // Topic-based Exam generation submit
  const handleStartExamTopics = async (e) => {
    e.preventDefault();
    if (selectedTopicIds.length === 0) {
      setErrorMsg('กรุณาเลือกอย่างน้อยหนึ่งหัวข้อ');
      return;
    }

    setGeneratingExam(true);
    setErrorMsg('');
    setWarningMsg('');

    try {
      const res = await fetch('/api/exam/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'topic',
          subjectId: selectedSubjectId,
          levelId: selectedLevelId,
          topicIds: selectedTopicIds,
          count: questionCount
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'เกิดข้อผิดพลาดในการจัดทำชุดข้อสอบ');
        setGeneratingExam(false);
        return;
      }

      sessionStorage.setItem('current_exam', JSON.stringify(data.questions));

      if (data.warning) {
        setWarningMsg(data.warning);
        setTimeout(() => {
          router.push('/exam');
        }, 1500);
      } else {
        router.push('/exam');
      }
    } catch (err) {
      console.error('Error starting exam:', err);
      setErrorMsg('เกิดข้อผิดพลาดทางเทคนิคในการเชื่อมต่อเซิร์ฟเวอร์');
      setGeneratingExam(false);
    }
  };


  // ==========================================
  // EXAM SETS PRACTICE MODE STATES & LOGIC
  // ==========================================
  const [metaExamSets, setMetaExamSets] = useState(['TEDET', 'O-NET']);
  const [metaYears, setMetaYears] = useState([]);
  const [loadingMeta, setLoadingMeta] = useState(false);

  // Filters for Exam Sets Mode
  const [setFilterExamSet, setSetFilterExamSet] = useState('ทั้งหมด');
  const [setFilterSubject, setSetFilterSubject] = useState('ทั้งหมด'); // 'ทั้งหมด', 'mathematics', 'science', 'thai', 'english'
  const [setFilterLevel, setSetFilterLevel] = useState('มัธยมต้น'); // 'ประถม', 'มัธยมต้น', 'มัธยมปลาย'
  const [setFilterYear, setSetFilterYear] = useState('ทั้งหมด');

  // Matching papers and selected paper states
  const [foundPapers, setFoundPapers] = useState([]);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [loadingPapers, setLoadingPapers] = useState(false);

  // Load sets & years metadata on mount
  useEffect(() => {
    async function loadMeta() {
      setLoadingMeta(true);
      try {
        const res = await fetch('/api/exam/sets-meta');
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            if (data.examSets && data.examSets.length > 0) setMetaExamSets(data.examSets);
            if (data.years) setMetaYears(data.years);
          }
        }
      } catch (err) {
        console.error('Error loading sets metadata:', err);
      } finally {
        setLoadingMeta(false);
      }
    }
    loadMeta();
  }, []);

  // Update matching papers list when filters change in Sets Mode
  useEffect(() => {
    if (activeTab !== 'sets') return;

    async function searchPapers() {
      setLoadingPapers(true);
      try {
        const res = await fetch('/api/exam/search-sets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            examSet: setFilterExamSet,
            subjectId: setFilterSubject,
            level: setFilterLevel,
            year: setFilterYear
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setFoundPapers(data.papers);
            // Auto-select first paper if current selection is not in list or none selected
            if (data.papers.length > 0) {
              const isStillAvailable = data.papers.some(p => p.paperId === selectedPaper?.paperId);
              if (!isStillAvailable) {
                setSelectedPaper(data.papers[0]);
              }
            } else {
              setSelectedPaper(null);
            }
          }
        }
      } catch (err) {
        console.error('Error searching sets:', err);
      } finally {
        setLoadingPapers(false);
      }
    }

    const timer = setTimeout(searchPapers, 250); // slight debounce
    return () => clearTimeout(timer);
  }, [activeTab, setFilterExamSet, setFilterSubject, setFilterLevel, setFilterYear]);

  // Sets Mode submit
  const handleStartExamSets = async (e) => {
    e.preventDefault();
    if (!selectedPaper) {
      setErrorMsg('กรุณาเลือกชุดข้อสอบก่อนเพื่อสร้างแบบทดสอบ');
      return;
    }

    setGeneratingExam(true);
    setErrorMsg('');
    setWarningMsg('');

    try {
      const res = await fetch('/api/exam/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'set',
          examSet: selectedPaper.examSet,
          subjectId: selectedPaper.subjectId,
          year: selectedPaper.year,
          grade: selectedPaper.grade
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'เกิดข้อผิดพลาดในการสร้างชุดข้อสอบ');
        setGeneratingExam(false);
        return;
      }

      sessionStorage.setItem('current_exam', JSON.stringify(data.questions));

      if (data.warning) {
        setWarningMsg(data.warning);
        setTimeout(() => {
          router.push('/exam');
        }, 1500);
      } else {
        router.push('/exam');
      }
    } catch (err) {
      console.error('Error starting sets exam:', err);
      setErrorMsg('เกิดข้อผิดพลาดทางเทคนิคในการเชื่อมต่อเซิร์ฟเวอร์');
      setGeneratingExam(false);
    }
  };


  return (
    <div className="cartoon-card p-6 md:p-8 max-w-2xl mx-auto w-full flex flex-col gap-6 bg-[#FAF7F0]">
      
      {/* Cartoon-Style Tab Selector */}
      <div className="flex border-b-4 border-[#2D2D2D] mb-2">
        <button
          type="button"
          onClick={() => {
            setActiveTab('topics');
            setErrorMsg('');
            setWarningMsg('');
          }}
          className={`py-3 px-6 font-black text-base md:text-lg rounded-t-xl border-t-4 border-x-4 border-[#2D2D2D] transition-all transform duration-150 ${
            activeTab === 'topics'
              ? 'bg-[#FAF7F0] text-[#E27B58] -translate-y-[-4px] z-10'
              : 'bg-[#E2DCC8] text-[#5E5E5E] hover:text-[#2D2D2D] opacity-80'
          }`}
          style={{ marginBottom: '-4px' }}
        >
          ทำข้อสอบแยกตามหัวข้อ
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('sets');
            setErrorMsg('');
            setWarningMsg('');
          }}
          className={`py-3 px-6 font-black text-base md:text-lg rounded-t-xl border-t-4 border-x-4 border-[#2D2D2D] transition-all transform duration-150 ${
            activeTab === 'sets'
              ? 'bg-[#FAF7F0] text-[#E27B58] -translate-y-[-4px] z-10'
              : 'bg-[#E2DCC8] text-[#5E5E5E] hover:text-[#2D2D2D] opacity-80'
          }`}
          style={{ marginBottom: '-4px' }}
        >
          ชุดข้อสอบ
        </button>
      </div>

      {/* ====================================================================== */}
      {/* TAB 1: TOPIC-BASED MODE FORM                                           */}
      {/* ====================================================================== */}
      {activeTab === 'topics' && (
        <form onSubmit={handleStartExamTopics} className="flex flex-col gap-6">
          
          {/* 1. Subject Selection */}
          <div className="flex flex-col gap-2">
            <label className="font-black text-lg flex items-center gap-2 text-[#2D2D2D]">
              <BookOpen size={20} className="text-[#E27B58]" />
              เลือกวิชา
            </label>
            <div className="grid grid-cols-2 gap-4">
              {subjects.map(sub => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setSelectedSubjectId(sub.id)}
                  className={`cartoon-btn justify-center py-3 text-base font-bold ${
                    selectedSubjectId === sub.id ? 'cartoon-btn-primary' : 'bg-white text-[#2D2D2D]'
                  }`}
                >
                  {sub.nameTh}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Level Selection */}
          <div className="flex flex-col gap-2">
            <label className="font-black text-lg flex items-center gap-2 text-[#2D2D2D]">
              <Layers size={20} className="text-[#E27B58]" />
              ระดับชั้น
            </label>
            <div className="grid grid-cols-3 gap-3">
              {availableLevels.map(lvl => (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => setSelectedLevelId(lvl.id)}
                  className={`cartoon-btn justify-center py-2 text-sm font-bold ${
                    selectedLevelId === lvl.id ? 'cartoon-btn-primary' : 'bg-white text-[#2D2D2D]'
                  }`}
                >
                  {lvl.nameTh}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Topics Checklist with Science Groupings */}
          <div className="flex flex-col gap-2">
            <label className="font-black text-lg flex items-center gap-2 text-[#2D2D2D]">
              <Settings size={20} className="text-[#E27B58]" />
              เลือกหัวข้อ
            </label>
            {loadingTopics ? (
              <div className="flex items-center gap-2 text-muted py-8 justify-center">
                <Loader2 className="animate-spin text-[#E27B58]" size={24} />
                กำลังโหลดหัวข้อข้อสอบ...
              </div>
            ) : availableTopics.length === 0 ? (
              <div className="cartoon-card bg-[#F0EDE6] p-6 text-center text-muted font-bold">
                ไม่มีหัวข้อข้อสอบในระบบ กรุณาอัปเดตข้อสอบจาก GitHub ก่อน
              </div>
            ) : (
              <div className="cartoon-card max-h-[350px] overflow-y-auto p-5 flex flex-col gap-4 bg-white border-4 border-[#2D2D2D]">
                
                {/* Select All / Deselect All Controls */}
                <div className="flex justify-between pb-3 border-b-2 border-dashed border-[#ccc]">
                  <button
                    type="button"
                    onClick={() => setSelectedTopicIds(availableTopics.map(t => t.id))}
                    className="text-xs text-blue-600 underline font-black"
                  >
                    เลือกทั้งหมด
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTopicIds([])}
                    className="text-xs text-red-600 underline font-black"
                  >
                    ไม่เลือกเลย
                  </button>
                </div>

                {/* Science grouped display vs. Math flat list */}
                {selectedSubjectId === 'science' ? (
                  getGroupedScienceTopics(availableTopics).map(group => (
                    <div key={group.name} className="flex flex-col gap-2 pb-2 border-b border-dashed border-[#eee] last:border-0">
                      <div className="flex items-center justify-between bg-[#F7F5EE] py-1 px-3 rounded-lg border-2 border-[#2D2D2D]">
                        <span className="font-black text-sm text-[#E27B58]">{group.name}</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const groupIds = group.list.map(t => t.id);
                              setSelectedTopicIds(prev => [...new Set([...prev, ...groupIds])]);
                            }}
                            className="text-[10px] text-blue-600 hover:underline font-bold"
                          >
                            เลือกกลุ่มนี้
                          </button>
                          <span className="text-[10px] text-gray-400">|</span>
                          <button
                            type="button"
                            onClick={() => {
                              const groupIds = group.list.map(t => t.id);
                              setSelectedTopicIds(prev => prev.filter(id => !groupIds.includes(id)));
                            }}
                            className="text-[10px] text-red-600 hover:underline font-bold"
                          >
                            ล้างกลุ่มนี้
                          </button>
                        </div>
                      </div>
                      <div className="pl-2 flex flex-col gap-1.5">
                        {group.list.map(topic => (
                          <label key={topic.id} className="flex items-start gap-2.5 cursor-pointer text-sm font-bold hover:text-[#E27B58] transition-colors py-0.5">
                            <input
                              type="checkbox"
                              checked={selectedTopicIds.includes(topic.id)}
                              onChange={() => handleToggleTopic(topic.id)}
                              className="w-4 h-4 accent-[#E27B58] cursor-pointer mt-0.5"
                            />
                            <span className="leading-tight">{topic.nameTh} ({topic.count})</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  // Mathematics or other subjects (Flat List)
                  <div className="flex flex-col gap-2">
                    {availableTopics.map(topic => (
                      <label key={topic.id} className="flex items-start gap-2.5 cursor-pointer text-sm font-bold hover:text-[#E27B58] transition-colors py-0.5">
                        <input
                          type="checkbox"
                          checked={selectedTopicIds.includes(topic.id)}
                          onChange={() => handleToggleTopic(topic.id)}
                          className="w-4 h-4 accent-[#E27B58] cursor-pointer mt-0.5"
                        />
                        <span className="leading-tight">{topic.nameTh} ({topic.count})</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 4. Question Count */}
          <div className="flex flex-col gap-2">
            <label className="font-black text-lg flex items-center gap-2 text-[#2D2D2D]">
              <HelpCircle size={20} className="text-[#E27B58]" />
              จำนวนข้อสอบ
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={questionCount}
              onChange={(e) => setQuestionCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="cartoon-input w-28 text-center text-lg font-black"
            />
          </div>

          {/* Messages */}
          {errorMsg && (
            <div className="cartoon-card bg-[#FCE8E6] border-red-500 text-red-700 p-4 font-bold text-center border-4">
              {errorMsg}
            </div>
          )}
          {warningMsg && (
            <div className="cartoon-card bg-[#FFF4E5] border-yellow-500 text-yellow-800 p-4 font-bold text-center animate-pulse border-4">
              {warningMsg}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={generatingExam || availableTopics.length === 0}
            className="cartoon-btn cartoon-btn-primary justify-center py-4 text-lg font-black mt-4 border-4"
          >
            {generatingExam ? (
              <>
                <Loader2 className="animate-spin" size={24} />
                กำลังสร้างชุดข้อสอบ...
              </>
            ) : (
              'เริ่มจำลองการทำข้อสอบ'
            )}
          </button>
        </form>
      )}

      {/* ====================================================================== */}
      {/* TAB 2: EXAM SETS PRACTICE MODE FORM                                    */}
      {/* ====================================================================== */}
      {activeTab === 'sets' && (
        <form onSubmit={handleStartExamSets} className="flex flex-col gap-6">
          
          {/* 1. Exam Set selection */}
          <div className="flex flex-col gap-2">
            <label className="font-black text-lg flex items-center gap-2 text-[#2D2D2D]">
              <Clipboard size={20} className="text-[#E27B58]" />
              ชุดข้อสอบ
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSetFilterExamSet('ทั้งหมด')}
                className={`cartoon-btn px-4 py-2 text-sm font-bold ${
                  setFilterExamSet === 'ทั้งหมด' ? 'cartoon-btn-primary' : 'bg-white text-[#2D2D2D]'
                }`}
              >
                ทั้งหมด
              </button>
              {metaExamSets.map(set => (
                <button
                  key={set}
                  type="button"
                  onClick={() => setSetFilterExamSet(set)}
                  className={`cartoon-btn px-4 py-2 text-sm font-bold ${
                    setFilterExamSet === set ? 'cartoon-btn-primary' : 'bg-white text-[#2D2D2D]'
                  }`}
                >
                  {set}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Subject Selection */}
          <div className="flex flex-col gap-2">
            <label className="font-black text-lg flex items-center gap-2 text-[#2D2D2D]">
              <BookOpen size={20} className="text-[#E27B58]" />
              วิชา
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                { id: 'ทั้งหมด', name: 'ทั้งหมด' },
                { id: 'mathematics', name: 'คณิตศาสตร์' },
                { id: 'science', name: 'วิทยาศาสตร์' },
                { id: 'thai', name: 'ภาษาไทย' },
                { id: 'english', name: 'ภาษาอังกฤษ' }
              ].map(sub => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setSetFilterSubject(sub.id)}
                  className={`cartoon-btn justify-center py-2 text-sm font-bold ${
                    setFilterSubject === sub.id ? 'cartoon-btn-primary' : 'bg-white text-[#2D2D2D]'
                  }`}
                >
                  {sub.name}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Level Selection */}
          <div className="flex flex-col gap-2">
            <label className="font-black text-lg flex items-center gap-2 text-[#2D2D2D]">
              <Layers size={20} className="text-[#E27B58]" />
              ระดับชั้น
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['ประถม', 'มัธยมต้น', 'มัธยมปลาย'].map(lvl => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setSetFilterLevel(lvl)}
                  className={`cartoon-btn justify-center py-2 text-sm font-bold ${
                    setFilterLevel === lvl ? 'cartoon-btn-primary' : 'bg-white text-[#2D2D2D]'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Year Selection (Buddhist Era พ.ศ. sorted highest to lowest) */}
          <div className="flex flex-col gap-2">
            <label className="font-black text-lg flex items-center gap-2 text-[#2D2D2D]">
              <ListFilter size={20} className="text-[#E27B58]" />
              ปี พ.ศ. ข้อสอบ
            </label>
            {loadingMeta ? (
              <span className="text-xs text-gray-500 font-bold">กำลังโหลดปีข้อสอบ...</span>
            ) : (
              <select
                value={setFilterYear}
                onChange={(e) => setSetFilterYear(e.target.value)}
                className="cartoon-input w-full bg-white font-bold"
              >
                <option value="ทั้งหมด">ทั้งหมด</option>
                {metaYears.map(yr => (
                  <option key={yr} value={yr}>
                    ปี พ.ศ. {yr}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 5. Found Exam Sets List */}
          <div className="flex flex-col gap-2">
            <label className="font-black text-lg flex items-center gap-2 text-[#2D2D2D]">
              <Clipboard size={20} className="text-[#E27B58]" />
              เลือกชุดข้อสอบที่ต้องการทำ
            </label>
            
            {loadingPapers ? (
              <div className="flex items-center justify-center gap-2 text-[#5E5E5E] font-bold py-6">
                <Loader2 className="animate-spin text-[#E27B58]" size={20} />
                กำลังค้นหาชุดข้อสอบ...
              </div>
            ) : foundPapers.length === 0 ? (
              <div className="cartoon-card bg-[#FCE8E6] border-red-400 text-red-700 p-6 text-center font-bold">
                ไม่พบชุดข้อสอบที่ตรงตามเงื่อนไขการค้นหา
              </div>
            ) : (
              <div className="cartoon-card max-h-[250px] overflow-y-auto p-4 flex flex-col gap-2.5 bg-white border-4 border-[#2D2D2D]">
                {foundPapers.map(paper => {
                  const isSelected = selectedPaper?.paperId === paper.paperId;
                  return (
                    <button
                      key={paper.paperId}
                      type="button"
                      onClick={() => setSelectedPaper(paper)}
                      className={`w-full text-left p-3 rounded-lg border-2 border-[#2D2D2D] font-bold transition-all flex items-center justify-between ${
                        isSelected 
                          ? 'bg-[#E27B58] text-white shadow-[2px_2px_0px_rgba(0,0,0,1)]' 
                          : 'bg-[#FDFBF7] text-[#2D2D2D] hover:bg-[#F5EFE6]'
                      }`}
                    >
                      <span className="text-sm md:text-base">{paper.friendlyName}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        isSelected ? 'bg-white/20 border-white' : 'bg-gray-100 border-[#2D2D2D]/30'
                      }`}>
                        {paper.questionCount} ข้อ
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Messages */}
          {errorMsg && (
            <div className="cartoon-card bg-[#FCE8E6] border-red-500 text-red-700 p-4 font-bold text-center border-4">
              {errorMsg}
            </div>
          )}
          {warningMsg && (
            <div className="cartoon-card bg-[#FFF4E5] border-yellow-500 text-yellow-800 p-4 font-bold text-center animate-pulse border-4">
              {warningMsg}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={generatingExam || !selectedPaper}
            className="cartoon-btn cartoon-btn-primary justify-center py-4 text-lg font-black mt-4 border-4"
          >
            {generatingExam ? (
              <>
                <Loader2 className="animate-spin" size={24} />
                กำลังเตรียมกระดาษคำถาม...
              </>
            ) : selectedPaper ? (
              `เริ่มทำข้อสอบ: ${selectedPaper.friendlyName}`
            ) : (
              'กรุณาเลือกชุดข้อสอบ'
            )}
          </button>
        </form>
      )}

    </div>
  );
}
