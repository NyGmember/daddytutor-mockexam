'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { renderMarkdown } from '@/lib/markdown';
import { 
  Settings, Save, Upload, Send, Search, PlusCircle, RefreshCw, 
  CheckCircle, AlertTriangle, HelpCircle, FileText, Image as ImageIcon,
  BookOpen, Layers, Star, Play, Clipboard
} from 'lucide-react';
import Link from 'next/link';

export default function LocalEditorPage() {
  // Config state
  const [configSubjects, setConfigSubjects] = useState([]);
  
  // Staging / Git state
  const [gitStatus, setGitStatus] = useState({ 
    allQuestionIds: [], 
    gitInitialized: true,
    remoteUrl: '',
    latestVersion: '',
    changedFiles: { questions: [], answers: [], images: [] } 
  });
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [selectedPushIds, setSelectedPushIds] = useState([]);
  
  // Push / Release state
  const [releaseVersion, setReleaseVersion] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [pushLoading, setPushLoading] = useState(false);
  const [pushResult, setPushResult] = useState(null);
  const [pushError, setPushError] = useState('');

  // Git Initialization Panel states
  const [gitInitLoading, setGitInitLoading] = useState(false);
  const [gitRemoteUrlInput, setGitRemoteUrlInput] = useState('');
  const [gitInitError, setGitInitError] = useState('');
  const [gitInitSuccess, setGitInitSuccess] = useState('');

  // Form states
  const [id, setId] = useState('');
  const [subjectId, setSubjectId] = useState('mathematics');
  const [levelId, setLevelId] = useState('math_lower_secondary');
  const [topicId, setTopicId] = useState('');
  const [customTopicId, setCustomTopicId] = useState(''); // Custom English topic ID e.g. algebraic_equations
  const [topicNameTh, setTopicNameTh] = useState('');
  const [year, setYear] = useState(2557);
  const [difficulty, setDifficulty] = useState(3);
  const [grade, setGrade] = useState('G7');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [answerText, setAnswerText] = useState('');

  // Active editors / views
  const [activeTab, setActiveTab] = useState('editor'); // 'editor', 'preview'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilters, setSelectedStatusFilters] = useState(['New']); // Array of 'New', 'Mod', 'Pub'
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState({ type: '', text: '' });
  const [isEditingExisting, setIsEditingExisting] = useState(false);

  // Refs for cursor manipulation
  const questionTextareaRef = useRef(null);
  const answerTextareaRef = useRef(null);
  const [activeTextarea, setActiveTextarea] = useState('question'); // 'question' or 'answer'

  // Load configuration and status on mount
  useEffect(() => {
    loadConfig();
    loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ensureArray = (val, key) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (val[key] && Array.isArray(val[key])) return val[key];
    return [];
  };

  const getTopicsForConfig = useCallback((subId, lvlId, subjectsList = configSubjects) => {
    const subject = subjectsList?.find?.(s => s.id === subId);
    if (!subject) return [];

    const configLvlId = lvlId ? lvlId.replace('math_', '').replace('sci_', '') : '';
    const levels = ensureArray(subject.levels, 'levels');

    if (subId === 'mathematics') {
      const level = levels.find(l => l.id === configLvlId);
      return ensureArray(level?.topics, 'topics');
    } else { // science
      if (configLvlId === 'primary') {
        const level = levels.find(l => l.id === 'primary');
        const categories = ensureArray(level?.categories, 'categories');
        const category = categories.find(c => c.id === 'general_science');
        return ensureArray(category?.topics, 'topics');
      } else { // lower_secondary or upper_secondary
        const level = levels.find(l => l.id === 'secondary');
        if (!level) return [];
        const categories = ensureArray(level.categories, 'categories');
        
        if (configLvlId === 'lower_secondary') {
          const category = categories.find(c => c.id === 'general_science');
          return ensureArray(category?.topics, 'topics');
        } else if (configLvlId === 'upper_secondary') {
          const upperCategories = categories.filter(c => c.id !== 'general_science') || [];
          const allTopics = [];
          for (const cat of upperCategories) {
            const catTopics = ensureArray(cat.topics, 'topics');
            allTopics.push(...catTopics);
          }
          return allTopics;
        }
      }
    }
    return [];
  }, [configSubjects]);

  const availableTopics = getTopicsForConfig(subjectId, levelId);

  // Resolve custom topic to standard topic once config is loaded
  useEffect(() => {
    if (configSubjects.length > 0 && topicId === 'custom' && customTopicId) {
      const loadedTopics = getTopicsForConfig(subjectId, levelId);
      const matched = loadedTopics.find(t => t.id === customTopicId);
      if (matched) {
        setTopicId(customTopicId);
        setCustomTopicId('');
        setTopicNameTh(matched.name_th || matched.nameTh || '');
      }
    }
  }, [configSubjects, subjectId, levelId, topicId, customTopicId, getTopicsForConfig]);

  const loadConfig = async () => {
    try {
      const res = await fetch('/api/local-editor/config');
      if (res.ok) {
        const data = await res.json();
        const rawSubjects = data.subjects || [];
        const subjectsArray = Array.isArray(rawSubjects) ? rawSubjects : rawSubjects.subjects || [];
        setConfigSubjects(subjectsArray);
        
        // Populate default topic on initial load if not set
        if (!topicId) {
          const initialTopics = getTopicsForConfig(subjectId, levelId, subjectsArray);
          if (initialTopics.length > 0) {
            setTopicId(initialTopics[0].id);
            setTopicNameTh(initialTopics[0].name_th || initialTopics[0].nameTh || '');
          }
        }
      }
    } catch (err) {
      console.error('Error loading config:', err);
    }
  };

  // Helper to increment version
  const incrementVersion = (versionStr) => {
    if (!versionStr) return '1.0.1';
    const parts = versionStr.split('.');
    if (parts.length > 0) {
      const lastPart = parts[parts.length - 1];
      const lastNum = parseInt(lastPart, 10);
      if (!isNaN(lastNum)) {
        const nextParts = [...parts];
        nextParts[nextParts.length - 1] = (lastNum + 1).toString();
        return nextParts.join('.');
      }
    }
    return versionStr + '.1';
  };

  const loadStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await fetch('/api/local-editor/status');
      if (res.ok) {
        const data = await res.json();
        setGitStatus(data);
        
        // Auto suggested version
        if (data.latestVersion) {
          setReleaseVersion(incrementVersion(data.latestVersion));
        } else {
          setReleaseVersion('1.0.1');
        }

        // Auto fill remote url input
        if (data.remoteUrl) {
          setGitRemoteUrlInput(data.remoteUrl);
        }
      }
    } catch (err) {
      console.error('Error loading status:', err);
    } finally {
      setLoadingStatus(false);
    }
  };

  // Load specific question details
  const handleLoadQuestion = async (qId) => {
    setSaveMessage({ type: '', text: '' });
    try {
      const res = await fetch(`/api/local-editor/load?id=${qId}`);
      if (res.ok) {
        const data = await res.json();
        const q = data.question;
        setId(q.id);
        setSubjectId(q.subjectId);
        setLevelId(q.levelId);
        setYear(q.year);
        setDifficulty(q.difficulty);
        setGrade(q.grade);
        setCorrectAnswer(q.correctAnswer);
        setQuestionText(q.questionText);
        setAnswerText(q.answerText);
        setIsEditingExisting(true);

        // Check if standard topic
        const loadedTopics = getTopicsForConfig(q.subjectId, q.levelId);
        const isStandardTopic = loadedTopics.some(t => t.id === q.topicId);

        if (isStandardTopic) {
          setTopicId(q.topicId);
          setCustomTopicId('');
          const matchedName = loadedTopics.find(t => t.id === q.topicId)?.name_th || q.topicNameTh || '';
          setTopicNameTh(matchedName);
        } else {
          setTopicId('custom');
          setCustomTopicId(q.topicId);
          setTopicNameTh(q.topicNameTh || '');
        }

      } else {
        alert('ไม่สามารถโหลดข้อมูลข้อสอบได้');
      }
    } catch (err) {
      console.error('Error loading question:', err);
      alert('เกิดข้อผิดพลาดในการติดต่อเซิร์ฟเวอร์');
    }
  };

  // Save question details
  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    if (!id) {
      setSaveMessage({ type: 'error', text: 'กรุณากรอกรหัสข้อสอบ (Question ID)' });
      return;
    }

    const resolvedTopicId = topicId === 'custom' ? customTopicId : topicId;
    if (!resolvedTopicId) {
      setSaveMessage({ type: 'error', text: 'กรุณาระบุรหัสหัวข้อ (Topic ID)' });
      return;
    }

    setSaveLoading(true);
    setSaveMessage({ type: '', text: '' });

    // Parse image names from questionText
    const imageList = [];
    const imgRegex = /!\[.*?\]\(\.\.\/images\/([^\)]+)\)/g;
    let match;
    while ((match = imgRegex.exec(questionText)) !== null) {
      imageList.push(match[1]);
    }

    try {
      const res = await fetch('/api/local-editor/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          subjectId,
          levelId,
          topicId: resolvedTopicId,
          topicNameTh,
          year: parseInt(year),
          difficulty: parseInt(difficulty),
          grade,
          correctAnswer,
          questionText,
          answerText,
          images: imageList
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSaveMessage({ type: 'success', text: `บันทึกข้อสอบ ${id} เรียบร้อยแล้ว ทั้งบนดิสก์และฐานข้อมูล SQLite` });
        loadStatus(); // refresh list
      } else {
        setSaveMessage({ type: 'error', text: data.error || 'ไม่สามารถบันทึกข้อสอบได้' });
      }
    } catch (err) {
      console.error('Error saving question:', err);
      setSaveMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์' });
    } finally {
      setSaveLoading(false);
    }
  };

  // Setup/Initialize git remote and repository
  const handleGitInit = async (e) => {
    e.preventDefault();
    setGitInitLoading(true);
    setGitInitError('');
    setGitInitSuccess('');
    try {
      const res = await fetch('/api/local-editor/git-init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remoteUrl: gitRemoteUrlInput })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setGitInitSuccess(data.message);
        loadStatus(); // Refresh status
      } else {
        setGitInitError(data.error || 'การเชื่อมต่อและอัปเดต Git ล้มเหลว');
      }
    } catch (err) {
      console.error('Git init fetch error:', err);
      setGitInitError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์เพื่อตั้งค่า Git');
    } finally {
      setGitInitLoading(false);
    }
  };

  // Push bundle release
  const handlePushRelease = async (e) => {
    e.preventDefault();
    if (selectedPushIds.length === 0) {
      setPushError('กรุณาเลือกข้อสอบอย่างน้อย 1 ข้อเพื่อจัดแพตช์เผยแพร่');
      return;
    }
    if (!releaseVersion) {
      setPushError('กรุณาระบุเวอร์ชันแพตช์ เช่น 1.0.1');
      return;
    }

    setPushLoading(true);
    setPushError('');
    setPushResult(null);

    try {
      const res = await fetch('/api/local-editor/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedIds: selectedPushIds,
          version: releaseVersion,
          commitMessage: commitMessage || `Release version ${releaseVersion}`
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPushResult(data);
        setSelectedPushIds([]); // Clear selection
        setReleaseVersion('');
        setCommitMessage('');
        loadStatus(); // refresh git status
      } else {
        setPushError(data.error || 'เกิดข้อผิดพลาดในการทำ Release แพตช์');
      }
    } catch (err) {
      console.error('Error pushing release:', err);
      setPushError('เกิดข้อผิดพลาดในการติดต่อเซิร์ฟเวอร์');
    } finally {
      setPushLoading(false);
    }
  };

  // Handle image drag-and-drop
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetTextarea) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        await uploadImageFile(file, targetTextarea);
      }
    }
  };

  const handleFileChange = async (e, targetTextarea) => {
    const files = e.target.files;
    if (files.length > 0) {
      await uploadImageFile(files[0], targetTextarea);
    }
  };

  const uploadImageFile = async (file, targetTextarea) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/local-editor/upload', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Insert Markdown syntax into current textarea
        const filename = data.filename;
        const markdownImg = `\n![illustration](../images/${filename})\n`;
        
        insertTextAtCursor(markdownImg, targetTextarea);
      } else {
        alert(data.error || 'อัปโหลดรูปภาพล้มเหลว');
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์เพื่ออัปโหลด');
    }
  };

  // Helper to insert text at cursor position in textareas
  const insertTextAtCursor = (textToInsert, targetTextarea) => {
    const textarea = targetTextarea === 'question' ? questionTextareaRef.current : answerTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = textarea.value;

    const newVal = currentVal.substring(0, start) + textToInsert + currentVal.substring(end);
    
    if (targetTextarea === 'question') {
      setQuestionText(newVal);
    } else {
      setAnswerText(newVal);
    }

    // Refocus and place cursor after inserted text
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + textToInsert.length;
    }, 50);
  };

  // Predefined LaTeX Insert Helper Toolbar
  const insertLatex = (latexCode) => {
    insertTextAtCursor(latexCode, activeTextarea);
  };

  const clearForm = () => {
    setId('');
    setQuestionText('');
    setAnswerText('');
    setCorrectAnswer('');
    setTopicId('');
    setCustomTopicId('');
    setTopicNameTh('');
    setIsEditingExisting(false);
    setSaveMessage({ type: '', text: '' });
  };

  // Filter list of questions based on search query and status tags
  const filteredQuestions = (gitStatus.questionsList || []).filter(q => {
    // 1. Tag filter check
    if (selectedStatusFilters.length > 0 && !selectedStatusFilters.includes(q.status)) {
      return false;
    }

    // 2. Search query check
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    
    // Match ID
    if (q.id.toLowerCase().includes(query)) return true;
    
    // Match Subject Thai Name
    const subject = configSubjects?.find?.(s => s.id === q.subjectId);
    const subjectName = subject?.name_th || subject?.nameTh || '';
    if (subjectName.toLowerCase().includes(query)) return true;
    
    // Match Topic Thai Name or English ID
    const levelIdClean = q.levelId ? q.levelId.replace('math_', '').replace('sci_', '') : '';
    const level = subject?.levels?.find?.(l => l.id === levelIdClean);
    const topic = level?.topics?.find?.(t => t.id === q.topicId);
    const topicName = topic?.name_th || '';
    if (topicName.toLowerCase().includes(query) || q.topicId.toLowerCase().includes(query)) {
      return true;
    }
    
    return false;
  });

  const filteredQuestionIds = filteredQuestions.map(q => q.id);

  // Check if all filtered items are selected
  const isAllFilteredSelected = filteredQuestionIds.length > 0 && 
    filteredQuestionIds.every(qId => selectedPushIds.includes(qId));

  const handleToggleSelectAll = () => {
    if (isAllFilteredSelected) {
      setSelectedPushIds(prev => prev.filter(qId => !filteredQuestionIds.includes(qId)));
    } else {
      setSelectedPushIds(prev => {
        const nextSelected = [...prev];
        filteredQuestionIds.forEach(qId => {
          if (!nextSelected.includes(qId)) {
            nextSelected.push(qId);
          }
        });
        return nextSelected;
      });
    }
  };

  // Check if a question has Git changes (Modified, Untracked, or Published)
  const getGitBadge = (qId) => {
    const q = (gitStatus.questionsList || []).find(x => x.id === qId);
    if (!q) return null;
    
    let badgeColor = 'bg-blue-500 text-white';
    let label = 'Pub';
    
    if (q.status === 'New') {
      badgeColor = 'bg-green-500 text-white';
      label = 'New';
    } else if (q.status === 'Mod') {
      badgeColor = 'bg-orange-500 text-white';
      label = 'Mod';
    }
    
    return (
      <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-black shadow-[1px_1px_0px_#000] uppercase ${badgeColor}`}>
        {label}
      </span>
    );
  };

  // Toggle selection for push
  const handleTogglePushId = (qId) => {
    setSelectedPushIds(prev => 
      prev.includes(qId) 
        ? prev.filter(id => id !== qId) 
        : [...prev, qId]
    );
  };

  // Previews rendered output
  const renderedQuestionHtml = renderMarkdown(questionText);
  const renderedAnswerHtml = renderMarkdown(answerText);

  return (
    <main className="min-h-screen py-10 px-6 md:px-12 lg:px-16 max-w-7xl xl:max-w-[1400px] mx-auto flex flex-col gap-8">
      {/* Top Header */}
      <header className="flex flex-col md:flex-row justify-between items-center gap-6 border-b-4 border-[#2D2D2D] pb-6 mb-2">
        <div className="flex flex-wrap items-center gap-4">
          <div className="sketch-border bg-[#E27B58] text-white py-2 px-6 inline-block shadow-[4px_4px_0px_#2D2D2D]">
            <h1 className="text-xl md:text-3xl font-black tracking-tight m-0 flex items-center gap-3">
              <Settings size={26} className="animate-spin-slow" />
              DaddyTutor Mock-Exam Editor
            </h1>
          </div>
          <span className="bg-white border-3 border-[#2D2D2D] rounded-full px-4 py-1.5 text-xs md:text-sm font-bold shadow-[2px_2px_0px_#2D2D2D] text-[#2D2D2D]">
            OFFLINE DEVELOPMENT MODE
          </span>
        </div>
        <div className="flex gap-3">
          <Link href="/" className="cartoon-btn py-2 px-5 text-sm font-bold gap-2">
            <BookOpen size={16} />
            เปิดดูแอปข้อสอบจำลอง
          </Link>
        </div>
      </header>

      {/* Editor Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        
        {/* Left Panel: Git Status & File Browser (4 cols) */}
        <section className="lg:col-span-4 flex flex-col gap-8">
          
          {/* Question List & Search */}
          <div className="cartoon-card p-6 bg-white flex flex-col gap-5">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-base md:text-lg flex items-center gap-2 border-b-3 border-[#2D2D2D] pb-2 w-full justify-between">
                <span>คลังไฟล์ข้อสอบ ({filteredQuestionIds.length})</span>
                <button onClick={loadStatus} disabled={loadingStatus} className="p-1.5 hover:bg-gray-100 rounded-lg border-2 border-transparent hover:border-black transition-all">
                  <RefreshCw size={16} className={loadingStatus ? 'animate-spin' : ''} />
                </button>
              </h2>
            </div>

            <div className="flex flex-col gap-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="ค้นหารหัสข้อสอบ หรือชื่อหัวข้อ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="cartoon-input w-full text-sm py-2"
                  style={{ paddingLeft: '2.5rem' }}
                />
                <Search size={16} className="absolute left-3.5 top-[13.5px] text-gray-400" />
              </div>

              {/* Tag Status Filters */}
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                <span>กรองสถานะ:</span>
                <div className="flex gap-1.5 flex-wrap">
                  {[
                    { status: 'New', label: 'New', color: 'bg-green-500 text-white' },
                    { status: 'Mod', label: 'Mod', color: 'bg-orange-500 text-white' },
                    { status: 'Pub', label: 'Pub', color: 'bg-blue-500 text-white' }
                  ].map(item => {
                    const isSelected = selectedStatusFilters.includes(item.status);
                    return (
                      <button
                        key={item.status}
                        type="button"
                        onClick={() => {
                          setSelectedStatusFilters(prev => 
                            prev.includes(item.status)
                              ? prev.filter(s => s !== item.status)
                              : [...prev, item.status]
                          );
                        }}
                        className={`px-2 py-0.5 rounded border border-black shadow-[1.5px_1.5px_0px_#000] text-[9px] font-extrabold transition-all uppercase ${
                          isSelected 
                            ? `${item.color} translate-x-[0.5px] translate-y-[0.5px] shadow-[0.5px_0.5px_0px_#000]` 
                            : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* List box */}
            <div className="min-h-[350px] max-h-[500px] overflow-y-auto border-3 border-black rounded-2xl p-2 flex flex-col gap-2 bg-[#FAF7F0] shadow-inner">
              <button 
                onClick={clearForm}
                className="text-left p-3 rounded-xl text-xs md:text-sm font-bold hover:bg-green-50 flex items-center gap-2 text-green-700 bg-white border-2 border-dashed border-green-600 transition-colors shadow-sm"
              >
                <PlusCircle size={16} />
                สร้างข้อสอบข้อใหม่...
              </button>

              {filteredQuestionIds.length > 0 && (
                <div className="flex items-center gap-2.5 p-2 border-b-2 border-dashed border-gray-300 bg-white rounded-lg shadow-sm">
                  <input
                    type="checkbox"
                    checked={isAllFilteredSelected}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 cursor-pointer accent-[#E27B58] border-2 border-black rounded shrink-0"
                    id="select-all-checkbox"
                  />
                  <label htmlFor="select-all-checkbox" className="text-xs font-bold text-gray-700 cursor-pointer">
                    เลือกทั้งหมดเพื่อเผยแพร่ ({filteredQuestionIds.length} ข้อ)
                  </label>
                </div>
              )}
              
              {filteredQuestionIds.length === 0 ? (
                <div className="text-center text-xs md:text-sm text-muted py-8 font-bold">ไม่พบข้อสอบที่ต้องการ</div>
              ) : (
                filteredQuestionIds.map(qId => {
                  const isSelectedForEdit = id === qId;
                  const isSelectedForPush = selectedPushIds.includes(qId);
                  
                  return (
                    <div 
                      key={qId} 
                      className={`flex items-center justify-between p-2.5 rounded-xl text-xs md:text-sm transition-all border-2 ${
                        isSelectedForEdit 
                          ? 'bg-orange-50 border-black font-bold shadow-[2px_2px_0px_#2D2D2D]' 
                          : 'bg-white hover:bg-[#FAF7F0] border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        {/* Checkbox for Release Selection */}
                        <input
                          type="checkbox"
                          checked={isSelectedForPush}
                          onChange={() => handleTogglePushId(qId)}
                          className="w-4 h-4 cursor-pointer accent-[#E27B58] border-2 border-black rounded shrink-0"
                        />
                        <button
                          onClick={() => handleLoadQuestion(qId)}
                          className="text-left font-mono truncate w-full flex items-center gap-2 text-gray-700 hover:text-black"
                          title={`โหลดข้อสอบ ${qId}`}
                        >
                          <FileText size={14} className="text-gray-400 shrink-0" />
                          <span className="truncate">{qId}</span>
                        </button>
                      </div>
                      
                      {/* Git Badge status indicator */}
                      <div className="shrink-0 flex items-center gap-1 ml-2">
                        {getGitBadge(qId)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Git Push & Release Patch Manager OR Git Setup Form */}
          {gitStatus.gitInitialized === false ? (
            <div className="cartoon-card p-6 bg-white flex flex-col gap-5 border-3 border-black shadow-[6px_6px_0px_#E27B58] transition-all">
              <h2 className="font-bold text-base md:text-lg flex items-center gap-2 border-b-3 border-[#2D2D2D] pb-2 w-full justify-between text-[#E27B58]">
                <span>ตั้งค่า Git Repository</span>
              </h2>
              <p className="text-xs font-bold text-gray-500">
                ยังไม่ได้ติดตั้ง Git หรือไม่มีประวัติคอมมิตในโฟลเดอร์นี้ กรุณาระบุ GitHub Repo URL เพื่อเริ่มต้นระบบควบคุมเวอร์ชันและอัปโหลดข้อสอบ
              </p>
              
              <form onSubmit={handleGitInit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs md:text-sm font-bold text-gray-700 uppercase tracking-wider">GitHub Remote URL (Optional)</label>
                  <input
                    type="url"
                    placeholder="เช่น https://github.com/username/repo.git"
                    value={gitRemoteUrlInput}
                    onChange={(e) => setGitRemoteUrlInput(e.target.value)}
                    className="cartoon-input text-sm py-2 px-3"
                  />
                </div>

                {gitInitError && (
                  <div className="text-xs text-red-700 bg-red-50 p-3 border-2 border-red-500 rounded-xl font-bold">
                    {gitInitError}
                  </div>
                )}

                {gitInitSuccess && (
                  <div className="text-xs text-green-800 bg-green-50 p-3 border-2 border-green-600 rounded-xl font-bold">
                    {gitInitSuccess}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={gitInitLoading}
                  className="cartoon-btn cartoon-btn-primary justify-center text-sm font-bold py-2.5 mt-2 shadow-[3px_3px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#000]"
                >
                  {gitInitLoading ? (
                    <>
                      <RefreshCw className="animate-spin" size={16} />
                      กำลังสร้างและตั้งค่า Git...
                    </>
                  ) : (
                    <>
                      <Settings size={16} />
                      สร้างและเชื่อมต่อ Git Repository
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="cartoon-card p-6 bg-white flex flex-col gap-5 border-3 border-black shadow-[6px_6px_0px_var(--accent-color)] hover:shadow-[8px_8px_0px_var(--accent-color)] transition-all">
              <h2 className="font-bold text-base md:text-lg flex items-center gap-2 border-b-3 border-[#2D2D2D] pb-2 w-full justify-between text-[#E27B58]">
                <span>ผู้จัดการการจัดทำแพตช์ (Release)</span>
                <span className="text-xs bg-[#E27B58] text-white px-3 py-1 rounded-full border-2 border-black font-bold shadow-[2px_2px_0px_#000]">
                  เลือกแล้ว {selectedPushIds.length} ข้อ
                </span>
              </h2>

              <form onSubmit={handlePushRelease} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs md:text-sm font-bold text-gray-700 uppercase tracking-wider">รหัสเวอร์ชันแพตช์ที่จะปล่อย (Release Version)</label>
                  <input
                    type="text"
                    placeholder="เช่น 1.0.1"
                    value={releaseVersion}
                    onChange={(e) => setReleaseVersion(e.target.value)}
                    className="cartoon-input text-sm py-2 px-3"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs md:text-sm font-bold text-gray-700 uppercase tracking-wider">บันทึกข้อความ Git Commit (Commit Message)</label>
                  <input
                    type="text"
                    placeholder="เช่น Add new TEDET questions"
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    className="cartoon-input text-sm py-2 px-3"
                  />
                </div>

                {pushError && (
                  <div className="text-xs md:text-sm text-red-700 bg-red-50 p-3 border-2 border-red-500 rounded-xl font-bold shadow-[2px_2px_0px_#000]">
                    {pushError}
                  </div>
                )}

                {pushResult && (
                  <div className="text-xs md:text-sm text-green-800 bg-green-50 p-4 border-2 border-green-600 rounded-xl flex flex-col gap-2 shadow-[2px_2px_0px_#000]">
                    <div className="font-bold flex items-center gap-1.5 text-green-700">
                      <CheckCircle size={16} />
                      <span>สำเร็จ! สร้างไฟล์แพตช์เรียบร้อย</span>
                    </div>
                    <p className="text-xs text-gray-650">{pushResult.message}</p>
                    {pushResult.gitPushSuccess ? (
                      <span className="text-xs text-green-600 font-bold">✓ Push ขึ้น GitHub สำเร็จแล้ว</span>
                    ) : (
                      <span className="text-xs text-orange-600 font-bold">⚠ บันทึกในเครื่องแล้ว แต่ Push ไม่ผ่าน: {pushResult.gitPushError}</span>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={pushLoading}
                  className="cartoon-btn cartoon-btn-primary justify-center text-sm font-bold py-2.5 mt-2 shadow-[3px_3px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#000]"
                >
                  {pushLoading ? (
                    <>
                      <RefreshCw className="animate-spin" size={16} />
                      กำลังจัดทำแพตช์และคอมมิต...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      ทำ Release Patch & Push ไป GitHub
                    </>
                  )}
                </button>
              </form>

              {/* GitHub Remote Settings */}
              <div className="text-xs border-t-2 border-dashed border-gray-200 pt-3 mt-2 flex flex-col gap-2">
                <div className="flex justify-between items-center text-gray-500 font-bold">
                  <span>GitHub Remote:</span>
                  <span className="truncate max-w-[200px] font-mono text-[10px]" title={gitStatus.remoteUrl || 'ยังไม่ได้ตั้งค่า remote'}>
                    {gitStatus.remoteUrl ? gitStatus.remoteUrl.split('/').slice(-2).join('/') : 'ไม่มี'}
                  </span>
                </div>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="เปลี่ยน GitHub URL..."
                    value={gitRemoteUrlInput}
                    onChange={(e) => setGitRemoteUrlInput(e.target.value)}
                    className="cartoon-input text-[11px] py-1 px-2.5 flex-1"
                  />
                  <button 
                    type="button" 
                    onClick={handleGitInit} 
                    disabled={gitInitLoading}
                    className="cartoon-btn text-[11px] py-1 px-3 shadow-[1px_1px_0px_#000]"
                  >
                    {gitInitLoading ? '...' : 'บันทึก'}
                  </button>
                </div>
                {gitInitError && (
                  <span className="text-[10px] text-red-650 font-bold">{gitInitError}</span>
                )}
                {gitInitSuccess && (
                  <span className="text-[10px] text-green-600 font-bold">{gitInitSuccess}</span>
                )}
              </div>
            </div>
          )}

        </section>

        {/* Right Panel: Edit / Preview Form (8 cols) */}
        <section className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Main Edit Form */}
          <div className="cartoon-card p-6 md:p-8 lg:p-10 bg-white flex flex-col gap-6">
            
            {/* Form Title & Clears */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-3 border-black pb-4 mb-2">
              <h2 className="font-black text-xl md:text-2xl flex items-center gap-2">
                {isEditingExisting ? `กำลังแก้ไขข้อสอบ: ${id}` : 'สร้างข้อสอบชุดใหม่'}
              </h2>
              {isEditingExisting && (
                <button onClick={clearForm} className="cartoon-btn py-1.5 px-4 text-xs md:text-sm font-bold">
                  ยกเลิกและสลับโหมดสร้างใหม่
                </button>
              )}
            </div>

            {/* Error or Success notification */}
            {saveMessage.text && (
              <div className={`cartoon-card p-4 md:p-5 text-sm md:text-base font-bold text-center border-2 shadow-[4px_4px_0px_#000] ${
                saveMessage.type === 'success' 
                  ? 'bg-green-50 border-green-600 text-green-800' 
                  : 'bg-red-50 border-red-600 text-red-800'
              }`}>
                {saveMessage.text}
              </div>
            )}

            {/* Editor vs Preview Tabs */}
            <div className="flex gap-3 border-b-2 border-gray-200 pb-3 mb-2">
              <button 
                type="button"
                onClick={() => setActiveTab('editor')}
                className={`py-2 px-5 text-xs md:text-sm font-bold rounded-lg border-2 transition-all ${
                  activeTab === 'editor' 
                    ? 'bg-black text-white border-black shadow-[2px_2px_0px_#E27B58]' 
                    : 'bg-white text-gray-700 border-gray-300 hover:border-black hover:bg-gray-50'
                }`}
              >
                หน้าต่างเครื่องมือแก้ไข (Editor)
              </button>
              <button 
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`py-2 px-5 text-xs md:text-sm font-bold rounded-lg border-2 transition-all ${
                  activeTab === 'preview' 
                    ? 'bg-black text-white border-black shadow-[2px_2px_0px_#E27B58]' 
                    : 'bg-white text-gray-700 border-gray-300 hover:border-black hover:bg-gray-50'
                }`}
              >
                ดูพรีวิวผลลัพธ์ (Live Preview)
              </button>
            </div>

            {/* TAB 1: Editor Form */}
            {activeTab === 'editor' ? (
              <form onSubmit={handleSaveQuestion} className="flex flex-col gap-6">
                
                {/* ID & Subject & Level */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs md:text-sm font-bold text-gray-700 uppercase tracking-wider">รหัสข้อสอบ (ID) <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      placeholder="เช่น TEDET_Math_2557_G7_31"
                      value={id}
                      onChange={(e) => setId(e.target.value)}
                      disabled={isEditingExisting}
                      className="cartoon-input text-sm md:text-base py-2.5 px-4"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs md:text-sm font-bold text-gray-700 uppercase tracking-wider">วิชา (Subject)</label>
                    <select
                      value={subjectId}
                      onChange={(e) => {
                        const newSub = e.target.value;
                        setSubjectId(newSub);
                        const defaultLvl = newSub === 'mathematics' ? 'math_lower_secondary' : 'sci_lower_secondary';
                        setLevelId(defaultLvl);
                        const newTopics = getTopicsForConfig(newSub, defaultLvl);
                        if (newTopics.length > 0) {
                          setTopicId(newTopics[0].id);
                          setTopicNameTh(newTopics[0].name_th || newTopics[0].nameTh || '');
                        } else {
                          setTopicId('');
                          setTopicNameTh('');
                        }
                      }}
                      className="cartoon-input text-sm md:text-base py-2.5 px-4 cursor-pointer"
                    >
                      <option value="mathematics">คณิตศาสตร์</option>
                      <option value="science">วิทยาศาสตร์</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs md:text-sm font-bold text-gray-700 uppercase tracking-wider">ระดับ (Level)</label>
                    <select
                      value={levelId}
                      onChange={(e) => {
                        const newLvl = e.target.value;
                        setLevelId(newLvl);
                        const newTopics = getTopicsForConfig(subjectId, newLvl);
                        if (newTopics.length > 0) {
                          setTopicId(newTopics[0].id);
                          setTopicNameTh(newTopics[0].name_th || newTopics[0].nameTh || '');
                        } else {
                          setTopicId('');
                          setTopicNameTh('');
                        }
                      }}
                      className="cartoon-input text-sm md:text-base py-2.5 px-4 cursor-pointer"
                    >
                      {subjectId === 'mathematics' ? (
                        <>
                          <option value="math_primary">ประถมศึกษา</option>
                          <option value="math_lower_secondary">มัธยมศึกษาตอนต้น</option>
                          <option value="math_upper_secondary">มัธยมศึกษาตอนปลาย</option>
                        </>
                      ) : (
                        <>
                          <option value="sci_primary">ประถมศึกษา</option>
                          <option value="sci_lower_secondary">มัธยมศึกษาตอนต้น</option>
                          <option value="sci_upper_secondary">มัธยมศึกษาตอนปลาย</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                {/* Grade & Year & Difficulty & Correct Answer */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-6">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs md:text-sm font-bold text-gray-700 uppercase tracking-wider">ระดับชั้น (Grade)</label>
                    <input
                      type="text"
                      placeholder="เช่น G7, P6"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      className="cartoon-input text-sm md:text-base py-2.5 px-4"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs md:text-sm font-bold text-gray-700 uppercase tracking-wider">ปี พ.ศ. (Year)</label>
                    <input
                      type="number"
                      placeholder="เช่น 2557"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="cartoon-input text-sm md:text-base py-2.5 px-4"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs md:text-sm font-bold text-gray-700 uppercase tracking-wider">ความยาก (Difficulty)</label>
                    <div className="flex items-center gap-1.5 py-1 bg-white border-3 border-black rounded-lg px-3 h-[47px] shadow-inner">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setDifficulty(star)}
                          className="hover:scale-115 transition"
                        >
                          <Star
                            size={20}
                            className={star <= difficulty ? 'fill-yellow-400 text-yellow-600' : 'text-gray-300'}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs md:text-sm font-bold text-gray-700 uppercase tracking-wider">คำตอบที่ถูกต้อง (Answer)</label>
                    <input
                      type="text"
                      placeholder="เช่น 17, 3"
                      value={correctAnswer}
                      onChange={(e) => setCorrectAnswer(e.target.value)}
                      className="cartoon-input text-sm md:text-base py-2.5 px-4"
                      required
                    />
                  </div>
                </div>

                {/* Topic selector (Dynamic from configuration.md) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-xs md:text-sm font-bold text-gray-700 uppercase tracking-wider">หัวข้อหลักตามหลักสูตร (Topic ID)</label>
                    <select
                      value={topicId}
                      onChange={(e) => {
                        const selTopicId = e.target.value;
                        setTopicId(selTopicId);
                        if (selTopicId === 'custom') {
                          setCustomTopicId('');
                          setTopicNameTh('');
                        } else {
                          const matched = availableTopics.find(t => t.id === selTopicId);
                          const matchedName = matched?.name_th || matched?.nameTh || '';
                          setTopicNameTh(matchedName);
                        }
                      }}
                      className="cartoon-input text-sm md:text-base py-2.5 px-4 cursor-pointer"
                    >
                      {availableTopics.map(topic => (
                        <option key={topic.id} value={topic.id}>
                          {topic.name_th || topic.nameTh} ({topic.id})
                        </option>
                      ))}
                      <option value="custom">-- กำหนดเอง (Custom Topic) --</option>
                    </select>
                  </div>

                  {topicId === 'custom' && (
                    <>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs md:text-sm font-bold text-gray-700 uppercase tracking-wider">ชื่อภาษาไทยหัวข้อ (Topic Name Thai) <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          placeholder="ชื่อหัวข้อข้อสอบภาษาไทย"
                          value={topicNameTh}
                          onChange={(e) => setTopicNameTh(e.target.value)}
                          className="cartoon-input text-sm md:text-base py-2.5 px-4"
                          required
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs md:text-sm font-bold text-gray-700 uppercase tracking-wider">รหัสหัวข้อภาษาอังกฤษ (Custom Topic ID) <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          placeholder="พิมพ์รหัสหัวข้อ เช่น linear_equations"
                          value={customTopicId}
                          onChange={(e) => setCustomTopicId(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '_'))}
                          className="cartoon-input text-sm md:text-base py-2.5 px-4"
                          required
                        />
                        <span className="text-[10px] text-gray-400 font-bold">ใช้ภาษาอังกฤษตัวพิมพ์เล็ก ตัวเลข ขีดกลาง (-) และขีดล่าง (_) เท่านั้น</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Predefined Math inserting helper toolbar */}
                <div className="flex flex-col gap-2 border-t-3 border-black pt-4 mt-2">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <label className="text-xs md:text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                      <HelpCircle size={16} className="text-[#E27B58]" />
                      บอร์ดสูตรและสัญลักษณ์ด่วน (แทรกลงในช่องที่เลือก)
                    </label>
                    <div className="flex gap-2">
                      <button 
                        type="button" 
                        onClick={() => setActiveTextarea('question')}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border-2 transition-all ${
                          activeTextarea === 'question' 
                            ? 'bg-[#E27B58] text-white border-black shadow-[2px_2px_0px_#000]' 
                            : 'bg-white text-gray-700 border-gray-300 hover:border-black'
                        }`}
                      >
                        แทรกในโจทย์ข้อสอบ
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setActiveTextarea('answer')}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border-2 transition-all ${
                          activeTextarea === 'answer' 
                            ? 'bg-[#E27B58] text-white border-black shadow-[2px_2px_0px_#000]' 
                            : 'bg-white text-gray-700 border-gray-300 hover:border-black'
                        }`}
                      >
                        แทรกในคำอธิบายเฉลย
                      </button>
                    </div>
                  </div>
                  
                  {/* Symbol buttons */}
                  <div className="flex flex-wrap gap-2 p-3 bg-[#FAF7F0] border-2 border-black rounded-xl shadow-inner">
                    <button type="button" onClick={() => insertLatex('$x$')} className="text-xs font-mono font-bold bg-white border-2 border-black rounded-lg px-2.5 py-1 hover:bg-orange-50 transition-colors shadow-[2px_2px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[0px_0px_0px_#000]">{"$ inline"}</button>
                    <button type="button" onClick={() => insertLatex('$$x$$')} className="text-xs font-mono font-bold bg-white border-2 border-black rounded-lg px-2.5 py-1 hover:bg-orange-50 transition-colors shadow-[2px_2px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[0px_0px_0px_#000]">{"$$ block"}</button>
                    <button type="button" onClick={() => insertLatex('\\frac{a}{b}')} className="text-xs font-mono font-bold bg-white border-2 border-black rounded-lg px-2.5 py-1 hover:bg-orange-50 transition-colors shadow-[2px_2px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[0px_0px_0px_#000]">{"\\frac{a}{b}"}</button>
                    <button type="button" onClick={() => insertLatex('\\sqrt{x}')} className="text-xs font-mono font-bold bg-white border-2 border-black rounded-lg px-2.5 py-1 hover:bg-orange-50 transition-colors shadow-[2px_2px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[0px_0px_0px_#000]">{"\\sqrt{x}"}</button>
                    <button type="button" onClick={() => insertLatex('x^y')} className="text-xs font-mono font-bold bg-white border-2 border-black rounded-lg px-2.5 py-1 hover:bg-orange-50 transition-colors shadow-[2px_2px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[0px_0px_0px_#000]">{"x^y"}</button>
                    <button type="button" onClick={() => insertLatex('x_y')} className="text-xs font-mono font-bold bg-white border-2 border-black rounded-lg px-2.5 py-1 hover:bg-orange-50 transition-colors shadow-[2px_2px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[0px_0px_0px_#000]">{"x_y"}</button>
                    <button type="button" onClick={() => insertLatex('\\triangle')} className="text-xs font-mono font-bold bg-white border-2 border-black rounded-lg px-2.5 py-1 hover:bg-orange-50 transition-colors shadow-[2px_2px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[0px_0px_0px_#000]">{"▲ Triangle"}</button>
                    <button type="button" onClick={() => insertLatex('\\angle')} className="text-xs font-mono font-bold bg-white border-2 border-black rounded-lg px-2.5 py-1 hover:bg-orange-50 transition-colors shadow-[2px_2px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[0px_0px_0px_#000]">{"∠ Angle"}</button>
                    <button type="button" onClick={() => insertLatex('^{\\circ}')} className="text-xs font-mono font-bold bg-white border-2 border-black rounded-lg px-2.5 py-1 hover:bg-orange-50 transition-colors shadow-[2px_2px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[0px_0px_0px_#000]">{"^{\\circ}"}</button>
                    <button type="button" onClick={() => insertLatex('\\pi')} className="text-xs font-mono font-bold bg-white border-2 border-black rounded-lg px-2.5 py-1 hover:bg-orange-50 transition-colors shadow-[2px_2px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[0px_0px_0px_#000]">{"π Pi"}</button>
                    <button type="button" onClick={() => insertLatex('\\theta')} className="text-xs font-mono font-bold bg-white border-2 border-black rounded-lg px-2.5 py-1 hover:bg-orange-50 transition-colors shadow-[2px_2px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[0px_0px_0px_#000]">{"θ Theta"}</button>
                    <button type="button" onClick={() => insertLatex('\\pm')} className="text-xs font-mono font-bold bg-white border-2 border-black rounded-lg px-2.5 py-1 hover:bg-orange-50 transition-colors shadow-[2px_2px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[0px_0px_0px_#000]">{"± Plus-Minus"}</button>
                    <button type="button" onClick={() => insertLatex('\\approx')} className="text-xs font-mono font-bold bg-white border-2 border-black rounded-lg px-2.5 py-1 hover:bg-orange-50 transition-colors shadow-[2px_2px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[0px_0px_0px_#000]">{"≈ Approx"}</button>
                    <button type="button" onClick={() => insertLatex('\\times')} className="text-xs font-mono font-bold bg-white border-2 border-black rounded-lg px-2.5 py-1 hover:bg-orange-50 transition-colors shadow-[2px_2px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[0px_0px_0px_#000]">{"×"}</button>
                    <button type="button" onClick={() => insertLatex('\\div')} className="text-xs font-mono font-bold bg-white border-2 border-black rounded-lg px-2.5 py-1 hover:bg-orange-50 transition-colors shadow-[2px_2px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[0px_0px_0px_#000]">{"÷"}</button>
                  </div>
                </div>

                {/* Question Text Markdown editor */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
                    <label className="text-xs md:text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText size={16} className="text-[#E27B58]" />
                      รายละเอียดคำถามโจทย์ (Markdown + LaTeX)
                    </label>
                    <span className="text-[10px] md:text-xs text-gray-500 font-medium">ลากและวางรูปภาพที่ต้องการลงในช่องนี้เพื่อแทรกไฟล์ภาพ</span>
                  </div>
                  
                  <div 
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'question')}
                    className="relative flex flex-col"
                  >
                    <textarea
                      ref={questionTextareaRef}
                      placeholder="พิมพ์โจทย์ข้อสอบที่นี่... ใช้ $...$ สำหรับสูตรคณิตศาสตร์ หรือลากวางไฟล์ภาพลงในช่องนี้ได้เลย"
                      value={questionText}
                      onChange={(e) => setQuestionText(e.target.value)}
                      onFocus={() => setActiveTextarea('question')}
                      className="cartoon-input font-sans text-sm md:text-base min-h-[160px] w-full p-4"
                      required
                    />
                    <div className="absolute right-3 bottom-3 flex items-center gap-1.5">
                      <label className="p-2 bg-[#FAF7F0] hover:bg-orange-50 border-2 border-black rounded-lg cursor-pointer shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#000] transition-all" title="อัปโหลดรูปภาพ">
                        <ImageIcon size={16} />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, 'question')}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Answer Text Markdown editor */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
                    <label className="text-xs md:text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers size={16} className="text-[#E27B58]" />
                      คำอธิบายและเฉลยวิธีทำอย่างละเอียด (Markdown + LaTeX)
                    </label>
                    <span className="text-[10px] md:text-xs text-gray-500 font-medium">ลากและวางรูปภาพที่ต้องการลงในช่องนี้เพื่อแทรกไฟล์ภาพ</span>
                  </div>

                  <div 
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'answer')}
                    className="relative flex flex-col"
                  >
                    <textarea
                      ref={answerTextareaRef}
                      placeholder="พิมพ์วิธีทำและเฉลยอย่างละเอียดที่นี่... ใช้ $...$ สำหรับสูตรคณิตศาสตร์ หรือลากวางไฟล์ภาพลงในช่องนี้ได้เลย"
                      value={answerText}
                      onChange={(e) => setAnswerText(e.target.value)}
                      onFocus={() => setActiveTextarea('answer')}
                      className="cartoon-input font-sans text-sm md:text-base min-h-[220px] w-full p-4"
                      required
                    />
                    <div className="absolute right-3 bottom-3 flex items-center gap-1.5">
                      <label className="p-2 bg-[#FAF7F0] hover:bg-orange-50 border-2 border-black rounded-lg cursor-pointer shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#000] transition-all" title="อัปโหลดรูปภาพ">
                        <ImageIcon size={16} />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, 'answer')}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Save button */}
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="cartoon-btn cartoon-btn-primary py-3 px-6 text-base md:text-lg font-bold justify-center gap-3 shadow-[4px_4px_0px_#000] mt-2 active:translate-x-[3px] active:translate-y-[3px] active:shadow-[1px_1px_0px_#000]"
                >
                  {saveLoading ? (
                    <>
                      <RefreshCw className="animate-spin" size={20} />
                      กำลังบันทึกและทำดัชนีฐานข้อมูล SQLite...
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      บันทึกข้อสอบ (Save to Local)
                    </>
                  )}
                </button>

              </form>
            ) : (
              /* TAB 2: Live rendering preview */
              <div className="flex flex-col gap-6 p-4 md:p-6 bg-[#FAF7F0] border-3 border-black rounded-2xl shadow-inner min-h-[450px]">
                
                {/* Question Preview Box */}
                <div className="bg-white border-3 border-black p-6 md:p-8 rounded-2xl relative overflow-hidden flex flex-col gap-3 shadow-[4px_4px_0px_#000]">
                  <div className="absolute top-0 right-0 bg-[#E27B58] text-white text-[10px] md:text-xs px-4 py-1.5 font-bold border-l-3 border-b-3 border-black rounded-bl-xl">
                    พรีวิวคำถาม (โจทย์)
                  </div>
                  <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(#000_1px,transparent_1px)] bg-[size:100%_2rem]" />
                  
                  <div 
                    className="question-body text-base md:text-lg prose max-w-none z-10 pt-6"
                    dangerouslySetInnerHTML={{ __html: renderedQuestionHtml || '<p class="text-gray-400 italic">โจทย์ยังว่างเปล่า...</p>' }}
                  />
                </div>

                {/* Answer Preview Box */}
                <div className="bg-white border-3 border-black p-6 md:p-8 rounded-2xl relative overflow-hidden flex flex-col gap-3 shadow-[4px_4px_0px_#000]">
                  <div className="absolute top-0 right-0 bg-black text-white text-[10px] md:text-xs px-4 py-1.5 font-bold border-l-3 border-b-3 border-black rounded-bl-xl">
                    พรีวิววิธีทำ (เฉลย)
                  </div>
                  <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(#000_1px,transparent_1px)] bg-[size:100%_2rem]" />
                  
                  <div className="pt-6 font-bold text-sm md:text-base text-[#E27B58] border-b-2 border-dashed border-gray-200 pb-3 mb-2 flex items-center gap-2">
                    <span>คำตอบสุดท้ายที่กรอก:</span>
                    <span className="bg-[#FFF4E5] border-2 border-[#E27B58] rounded-lg px-4 py-1 text-black font-mono font-bold shadow-[2px_2px_0px_#000]">{correctAnswer || 'ยังไม่ระบุ'}</span>
                  </div>

                  <div 
                    className="question-body text-sm md:text-base prose max-w-none z-10"
                    dangerouslySetInnerHTML={{ __html: renderedAnswerHtml || '<p class="text-gray-400 italic">เฉลยวิธีทำยังว่างเปล่า...</p>' }}
                  />
                </div>
              </div>
            )}

          </div>

        </section>

      </div>
    </main>
  );
}
