'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Star, BookOpen, Layers, Settings, HelpCircle, Loader2 } from 'lucide-react';

export default function CustomExamForm({ subjects }) {
  const router = useRouter();
  
  // Selection states
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id || '');
  const [selectedLevelId, setSelectedLevelId] = useState('');
  
  // Loaded state
  const [availableTopics, setAvailableTopics] = useState([]);
  const [selectedTopicIds, setSelectedTopicIds] = useState([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState([1, 2, 3]); // default selected
  const [questionCount, setQuestionCount] = useState(10);
  
  // UI States
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [generatingExam, setGeneratingExam] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [warningMsg, setWarningMsg] = useState('');
  
  // Get levels for selected subject
  const currentSubject = subjects.find(s => s.id === selectedSubjectId);
  const availableLevels = currentSubject?.levels || [];

  // Set default level when subject changes
  useEffect(() => {
    if (availableLevels.length > 0) {
      setSelectedLevelId(availableLevels[0].id);
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

  // Toggle difficulty selection
  const handleToggleDifficulty = (diff) => {
    setSelectedDifficulties(prev => 
      prev.includes(diff) 
        ? prev.filter(d => d !== diff) 
        : [...prev, diff]
    );
  };

  // Generate exam and navigate
  const handleStartExam = async (e) => {
    e.preventDefault();
    if (selectedDifficulties.length === 0) {
      setErrorMsg('กรุณาเลือกอย่างน้อยหนึ่งระดับความยาก (ดาว)');
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
          subjectId: selectedSubjectId,
          levelId: selectedLevelId,
          topicIds: selectedTopicIds,
          difficulties: selectedDifficulties,
          count: questionCount
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'เกิดข้อผิดพลาดในการจัดทำชุดข้อสอบ');
        setGeneratingExam(false);
        return;
      }

      // Save question set to sessionStorage
      sessionStorage.setItem('current_exam', JSON.stringify(data.questions));
      
      if (data.warning) {
        // If warning exists (e.g. fewer questions than requested), alert the user and delay redirect slightly
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

  return (
    <form onSubmit={handleStartExam} className="cartoon-card p-6 md:p-8 max-w-2xl mx-auto w-full flex flex-col gap-6">
      
      {/* 1. Subject Selection */}
      <div className="flex flex-col gap-2">
        <label className="font-bold text-lg flex items-center gap-2">
          <BookOpen size={20} />
          เลือกวิชา
        </label>
        <div className="grid grid-cols-2 gap-4">
          {subjects.map(sub => (
            <button
              key={sub.id}
              type="button"
              onClick={() => setSelectedSubjectId(sub.id)}
              className={`cartoon-btn justify-center py-3 text-base ${selectedSubjectId === sub.id ? 'cartoon-btn-primary' : ''}`}
            >
              {sub.nameTh}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Level Selection */}
      <div className="flex flex-col gap-2">
        <label className="font-bold text-lg flex items-center gap-2">
          <Layers size={20} />
          ระดับชั้น
        </label>
        <div className="grid grid-cols-3 gap-3">
          {availableLevels.map(lvl => (
            <button
              key={lvl.id}
              type="button"
              onClick={() => setSelectedLevelId(lvl.id)}
              className={`cartoon-btn justify-center py-2 text-sm ${selectedLevelId === lvl.id ? 'cartoon-btn-primary' : ''}`}
            >
              {lvl.nameTh}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Topics Checklist */}
      <div className="flex flex-col gap-2">
        <label className="font-bold text-lg flex items-center gap-2">
          <Settings size={20} />
          เลือกหัวข้อ
        </label>
        {loadingTopics ? (
          <div className="flex items-center gap-2 text-muted py-4 justify-center">
            <Loader2 className="animate-spin" size={20} />
            กำลังโหลดหัวข้อข้อสอบ...
          </div>
        ) : availableTopics.length === 0 ? (
          <div className="cartoon-card bg-[#F0EDE6] p-4 text-center text-muted font-medium">
            ไม่มีหัวข้อข้อสอบในระบบ กรุณาอัปเดตข้อสอบจาก GitHub ก่อน
          </div>
        ) : (
          <div className="cartoon-card max-h-48 overflow-y-auto p-4 flex flex-col gap-2 bg-[#FAF7F0] border-2">
            <div className="flex justify-between mb-2 pb-2 border-b-2 border-dashed border-[#ccc]">
              <button 
                type="button" 
                onClick={() => setSelectedTopicIds(availableTopics.map(t => t.id))}
                className="text-xs text-blue-600 underline font-bold"
              >
                เลือกทั้งหมด
              </button>
              <button 
                type="button" 
                onClick={() => setSelectedTopicIds([])}
                className="text-xs text-red-600 underline font-bold"
              >
                ไม่เลือกเลย
              </button>
            </div>
            {availableTopics.map(topic => (
              <label key={topic.id} className="flex items-center gap-2 cursor-pointer text-sm font-medium hover:text-[#E27B58]">
                <input
                  type="checkbox"
                  checked={selectedTopicIds.includes(topic.id)}
                  onChange={() => handleToggleTopic(topic.id)}
                  className="w-4 h-4 accent-[#E27B58] cursor-pointer"
                />
                {topic.nameTh} ({topic.count})
              </label>
            ))}
          </div>
        )}
      </div>

      {/* 4. Difficulty Star Selection */}
      <div className="flex flex-col gap-2">
        <label className="font-bold text-lg flex items-center gap-2">
          <Star size={20} />
          ระดับความยาก (เลือกได้หลายตัว)
        </label>
        <div className="flex items-center gap-4 py-2">
          {[1, 2, 3, 4, 5].map(star => {
            const isSelected = selectedDifficulties.includes(star);
            return (
              <button
                key={star}
                type="button"
                onClick={() => handleToggleDifficulty(star)}
                className="flex flex-col items-center gap-1 cursor-pointer bg-transparent border-0 outline-none"
              >
                <div className="transition-transform duration-100 active:scale-95">
                  <Star
                    size={36}
                    fill={isSelected ? '#E27B58' : 'none'}
                    stroke={isSelected ? '#E27B58' : '#2D2D2D'}
                    strokeWidth={2.5}
                  />
                </div>
                <span className="text-xs font-bold">{star} ดาว</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Question Count */}
      <div className="flex flex-col gap-2">
        <label className="font-bold text-lg flex items-center gap-2">
          <HelpCircle size={20} />
          จำนวนข้อสอบ
        </label>
        <input
          type="number"
          min={1}
          max={100}
          value={questionCount}
          onChange={(e) => setQuestionCount(Math.max(1, parseInt(e.target.value) || 1))}
          className="cartoon-input w-28 text-center text-lg font-bold"
        />
      </div>

      {/* Message Area */}
      {errorMsg && (
        <div className="cartoon-card bg-[#FCE8E6] border-red-500 text-red-700 p-4 font-bold text-center">
          {errorMsg}
        </div>
      )}
      {warningMsg && (
        <div className="cartoon-card bg-[#FFF4E5] border-yellow-500 text-yellow-800 p-4 font-bold text-center animate-pulse">
          {warningMsg}
        </div>
      )}

      {/* Action Button */}
      <button
        type="submit"
        disabled={generatingExam || availableTopics.length === 0}
        className="cartoon-btn cartoon-btn-primary justify-center py-3 text-lg font-bold mt-4"
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
  );
}
