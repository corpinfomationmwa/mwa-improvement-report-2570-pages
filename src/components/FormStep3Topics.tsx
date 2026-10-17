import React, { useState, useEffect } from 'react';
import { CommunicationTopicItem } from '../types/mwa';
import { useFormOptions } from '../hooks/useFormOptions';
import { matchTopicsFromText } from '../utils/topicKeywordMatcher';
import { Plus, Trash2, Paperclip, Sparkles, AlertCircle } from 'lucide-react';
import { createDocumentPreview } from '../utils/documentPreview';

interface FormStep3TopicsProps {
  topics: CommunicationTopicItem[];
  onAddTopic: () => void;
  onRemoveTopic: (id: number) => void;
  onUpdateTopic: (id: number, updated: Partial<CommunicationTopicItem>) => void;
  onPrev: () => void;
  onNext: () => void;
  highlightedTopicIndex?: number | null;
  highlightedFieldId?: string | null;
}

export const FormStep3Topics: React.FC<FormStep3TopicsProps> = ({
  topics,
  onAddTopic,
  onRemoveTopic,
  onUpdateTopic,
  onPrev,
  onNext,
  highlightedTopicIndex,
  highlightedFieldId
}) => {
  const {
    topics: availableTopics,
    internalChannels: internalChannelsList,
    externalChannels: externalChannelsList,
    internalAudiences: internalAudienceList,
    externalAudiences: externalAudienceList
  } = useFormOptions();

  const [fileWarning, setFileWarning] = useState<string | null>(null);

  // Guarantee that topics is never empty (always at least 1 item)
  useEffect(() => {
    if (!topics || topics.length === 0) {
      onAddTopic();
    }
  }, [topics, onAddTopic]);

  // Fallback to guarantee that at least Topic 1 is rendered with completely empty fields
  const currentTopics: CommunicationTopicItem[] = (topics && topics.length > 0)
    ? topics
    : [
        {
          id: 1,
          selectedTopics: [],
          details: '',
          communicationTypes: { internal: false, external: false },
          internalChannels: [],
          externalChannels: [],
          internalAudiences: [],
          internalAudienceDetails: {},
          externalAudiences: [],
          externalAudienceDetails: {},
          evidenceFiles: [],
          additionalDetails: ''
        }
      ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  const handleTopicCheck = (topicItem: CommunicationTopicItem, topicName: string) => {
    const exists = topicItem.selectedTopics.includes(topicName);
    const updated = exists
      ? topicItem.selectedTopics.filter((t) => t !== topicName)
      : [...topicItem.selectedTopics, topicName];
    onUpdateTopic(topicItem.id, { selectedTopics: updated });
  };

  // Details change handler: DO NOT auto-check checkboxes! User must choose topics themselves
  const handleDetailsChange = (topicItem: CommunicationTopicItem, text: string) => {
    onUpdateTopic(topicItem.id, { details: text });
  };

  // Internal Channels
  const handleInternalChannelCheck = (topicItem: CommunicationTopicItem, channel: string) => {
    const exists = topicItem.internalChannels.includes(channel);
    const updated = exists
      ? topicItem.internalChannels.filter((c) => c !== channel)
      : [...topicItem.internalChannels, channel];
    onUpdateTopic(topicItem.id, { internalChannels: updated });
  };

  // External Channels
  const handleExternalChannelCheck = (topicItem: CommunicationTopicItem, channel: string) => {
    const exists = topicItem.externalChannels.includes(channel);
    const updated = exists
      ? topicItem.externalChannels.filter((c) => c !== channel)
      : [...topicItem.externalChannels, channel];
    onUpdateTopic(topicItem.id, { externalChannels: updated });
  };

  // Internal Audience
  const handleInternalAudienceCheck = (topicItem: CommunicationTopicItem, label: string) => {
    const exists = topicItem.internalAudiences.includes(label);
    const updated = exists
      ? topicItem.internalAudiences.filter((a) => a !== label)
      : [...topicItem.internalAudiences, label];
    onUpdateTopic(topicItem.id, { internalAudiences: updated });
  };

  // External Audience
  const handleExternalAudienceCheck = (topicItem: CommunicationTopicItem, label: string) => {
    const exists = topicItem.externalAudiences.includes(label);
    const updated = exists
      ? topicItem.externalAudiences.filter((a) => a !== label)
      : [...topicItem.externalAudiences, label];
    onUpdateTopic(topicItem.id, { externalAudiences: updated });
  };

  // Compress raster images before retaining them in form state. This lowers memory use
  // and keeps report/email payloads manageable for large camera photos.
  const compressEvidenceImage = async (file: File, maxDimension = 1600, quality = 0.78): Promise<string> => {
    const source = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error(`อ่านไฟล์ ${file.name} ไม่สำเร็จ`));
      reader.readAsDataURL(file);
    });
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`เปิดภาพ ${file.name} ไม่สำเร็จ`));
      img.src = source;
    });
    const ratio = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
    const ctx = canvas.getContext('2d');
    if (!ctx) return source;
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', quality);
  };

  // Preview large documents transiently; only image evidence is retained as data URL.
  // Allow up to 5 files per topic and process sequentially to avoid decoding many large files at once.
  const handleFileChange = async (topicId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const topicItem = topics.find((t) => t.id === topicId);
    const currentFiles = topicItem?.evidenceFiles || [];
    const incomingFiles = Array.from(e.target.files);
    if (currentFiles.length + incomingFiles.length > 5) {
      setFileWarning('คุณสามารถแนบไฟล์ได้สูงสุด 5 ไฟล์ต่อหนึ่งประเด็นเท่านั้น');
      e.target.value = '';
      return;
    }
    setFileWarning(null);

    try {
      const newItems: Array<{ name: string; size: string; url?: string; dataUrl?: string; previewUrl?: string; mimeType: string }> = [];
      for (const file of incomingFiles) {
        const isImage = file.type.startsWith('image/');
        let storedImage: string | undefined;
        let fileDataUrl: string | undefined;
        let previewUrl: string | undefined;
        if (isImage) {
          storedImage = await compressEvidenceImage(file);
          fileDataUrl = storedImage;
          previewUrl = storedImage;
        } else {
          // Read non-image files only for preview generation, then discard their in-memory data URL.
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = () => reject(new Error(`อ่านไฟล์ ${file.name} ไม่สำเร็จ`));
            reader.readAsDataURL(file);
          });
          try {
            fileDataUrl = dataUrl;
            previewUrl = await createDocumentPreview(file, dataUrl);
          } catch (error) {
            console.warn('[Evidence preview] Cannot render document preview:', file.name, error);
          }
        }
        newItems.push({
          name: file.name,
          size: `${(file.size / 1024).toFixed(1)} KB`,
          url: storedImage,
          dataUrl: fileDataUrl,
          previewUrl,
          mimeType: isImage ? 'image/jpeg' : (file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : ''))
        });
      }
      onUpdateTopic(topicId, { evidenceFiles: [...currentFiles, ...newItems].slice(0, 5) });
    } catch (error) {
      console.error('[Evidence upload]', error);
      setFileWarning('อ่านไฟล์ไม่สำเร็จ กรุณาลองแนบไฟล์อีกครั้ง');
    } finally {
      e.target.value = '';
    }
  };

  // Remove individual evidence file
  const handleRemoveFile = (topicId: number, fileIndex: number) => {
    const topicItem = topics.find((t) => t.id === topicId);
    if (!topicItem) return;
    const updatedFiles = (topicItem.evidenceFiles || []).filter((_, idx) => idx !== fileIndex);
    onUpdateTopic(topicId, { evidenceFiles: updatedFiles });
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="mwa-form-section">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 mb-3 border-b border-slate-100 gap-2">
          <h3 className="mb-0">3. รายละเอียดการสื่อสาร (สามารถเพิ่มได้สูงสุด 30 ประเด็น)</h3>
          <span className="text-[11px] text-sky-700 bg-sky-50 px-2.5 py-1 rounded border border-sky-200 inline-flex items-center gap-1.5 self-start sm:self-auto font-medium">
            <Sparkles className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            <span>ระบบเลือกประเด็นให้อัตโนมัติจากคำสำคัญ</span>
          </span>
        </div>

        {/* Global inline alert for file limit warning if applicable */}

        {fileWarning && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{fileWarning}</span>
          </div>
        )}

        <div className="space-y-6">
          {currentTopics.map((item, index) => {
            const detectedForThisItem = matchTopicsFromText(item.details);

            const handleAppendSampleWord = (word: string) => {
              const current = item.details.trim();
              const next = current ? `${current} ${word}` : word;
              handleDetailsChange(item, next);
            };

            const isHighlighted = highlightedTopicIndex === index + 1;

            return (
              <div
                key={item.id}
                id={`topic-card-${index + 1}`}
                className={`p-5 border rounded-lg transition-all duration-300 relative ${
                  isHighlighted
                    ? 'border-amber-400 bg-amber-50/60 ring-2 ring-amber-400/80 shadow-md'
                    : 'border-slate-200 bg-slate-50/60'
                }`}
              >
                {/* Header of Topic */}
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
                  <span className="font-bold text-slate-800 text-sm">
                    ประเด็นที่ {index + 1}
                  </span>
                  {currentTopics.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onRemoveTopic(item.id)}
                      className="text-rose-600 hover:text-rose-800 text-xs flex items-center gap-1 font-medium"
                      title="ลบประเด็นนี้"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>ลบประเด็นนี้</span>
                    </button>
                  )}
                </div>

                {/* 1. Topics Selection Grid */}
                <div
                  id={`topic-field-selectedTopics-${index + 1}`}
                  className={`mwa-form-group transition-all ${
                    highlightedFieldId === `topic-field-selectedTopics-${index + 1}`
                      ? 'p-3 rounded-lg border-2 border-rose-500 bg-rose-50/50 ring-2 ring-rose-200'
                      : ''
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <label className="mb-0 font-bold">เลือกประเด็นการสื่อสาร (เลือกได้หลายประเด็น) *</label>
                    {detectedForThisItem.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-emerald-600" />
                          <span>ตรวจพบ {detectedForThisItem.length} ประเด็นจากข้อความ</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const combined = Array.from(new Set([...item.selectedTopics, ...detectedForThisItem]));
                            onUpdateTopic(item.id, { selectedTopics: combined });
                          }}
                          className="text-[10px] font-semibold text-emerald-800 bg-white hover:bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300 transition-colors cursor-pointer shadow-2xs"
                          title="คลิกเพื่อเลือกประเด็นที่ระบบตรวจพบ"
                        >
                          เลือกตามที่ตรวจพบ
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-52 overflow-y-auto p-2 border border-slate-200 rounded bg-white">
                    {availableTopics.map((topicName) => {
                      const isDetected = detectedForThisItem.includes(topicName);
                      const isChecked = item.selectedTopics.includes(topicName);
                      return (
                        <label
                          key={topicName}
                          className={`mwa-checkbox-item transition-all ${
                            isDetected ? 'border-emerald-400 bg-emerald-50/50' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleTopicCheck(item, topicName)}
                          />
                          <span className="leading-snug">{topicName}</span>
                          {isDetected && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded-full ml-auto shrink-0 flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5 text-emerald-600" /> ตรวจพบอัตโนมัติ
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Display selected tags */}
                <div className="mwa-form-group">
                  <label>ประเด็นที่เลือก:</label>
                  <div className="p-2.5 border border-slate-200 rounded bg-white min-h-[40px] flex flex-wrap gap-1.5 items-center">
                    {item.selectedTopics.length === 0 ? (
                      <span className="text-xs text-slate-400 italic">ยังไม่ได้เลือกประเด็น (พิมพ์ข้อความด้านล่างเพื่อให้ระบบเลือกให้อัตโนมัติ หรือติ๊กเลือกด้วยตนเอง)</span>
                    ) : (
                      item.selectedTopics.map((st) => (
                        <span key={st} className="mwa-topic-tag">
                          {st}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* 2. Communication Details */}
                <div
                  id={`topic-field-details-${index + 1}`}
                  className={`mwa-form-group transition-all ${
                    highlightedFieldId === `topic-field-details-${index + 1}`
                      ? 'p-3 rounded-lg border-2 border-rose-500 bg-rose-50/50 ring-2 ring-rose-200'
                      : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor={`details-${item.id}`} className="mb-0 font-bold">
                      รายละเอียดที่ทำการสื่อสาร *
                    </label>
                    <span className="text-[11px] text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 inline-flex items-center gap-1 font-medium">
                      <Sparkles className="w-3 h-3 text-sky-600" />
                      <span>ระบบเลือกประเด็นให้อัตโนมัติจากข้อความ</span>
                    </span>
                  </div>
                  <textarea
                    id={`details-${item.id}`}
                    placeholder="กรุณากรอกรายละเอียดเนื้อหาการสื่อสาร เช่น เมื่อพิมพ์ 'ความผูกพันธ์' ระบบจะเลือก 'ความผูกพันองค์กร' ให้อัตโนมัติ"
                    required
                    rows={4}
                    value={item.details}
                    onChange={(e) => handleDetailsChange(item, e.target.value)}
                    className={highlightedFieldId === `topic-field-details-${index + 1}` ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200' : ''}
                  />

                  {/* Real-time detected indicator banner */}
                  {detectedForThisItem.length > 0 && (
                    <div className="mt-2.5 p-3 bg-emerald-50 border border-emerald-400 rounded-lg flex flex-col gap-1.5 animate-in fade-in">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                        <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>ตรวจพบคำสำคัญในข้อความ! ระบบติ๊กเลือกประเด็นให้อัตโนมัติ ({detectedForThisItem.length} ประเด็น):</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-0.5">
                        {detectedForThisItem.map((topicName) => (
                          <span
                            key={topicName}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-emerald-400 text-emerald-800 rounded-full text-xs font-semibold shadow-xs"
                          >
                            <span className="text-emerald-600 font-extrabold">✓</span> {topicName}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick test pills */}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="text-[11px] text-slate-500 font-medium">ทดลองคลิกเพื่อทดสอบจับคำสำคัญ:</span>
                    {['ความผูกพันธ์', 'นวัตกรรม', 'ลดน้ำสูญเสีย', 'ความปลอดภัย', 'Digital MWA'].map((sample) => (
                      <button
                        key={sample}
                        type="button"
                        onClick={() => handleAppendSampleWord(sample)}
                        className="text-[11px] bg-sky-50 hover:bg-sky-100 text-sky-700 px-2 py-0.5 rounded border border-sky-200 transition-colors cursor-pointer"
                      >
                        + "{sample}"
                      </button>
                    ))}
                  </div>
                </div>

              {/* 3. Type of Communication */}
              <div
                id={`topic-field-types-${index + 1}`}
                className={`mwa-form-group transition-all ${
                  highlightedFieldId === `topic-field-types-${index + 1}`
                    ? 'p-3 rounded-lg border-2 border-rose-500 bg-rose-50/50 ring-2 ring-rose-200'
                    : ''
                }`}
              >
                <label className="font-semibold text-slate-800">
                  เลือกประเภทการสื่อสาร (เลือกได้ทั้งสองตัวเลือก) *
                </label>
                <div className="flex flex-wrap gap-4 mt-1">
                  <label className="mwa-checkbox-item">
                    <input
                      type="checkbox"
                      checked={item.communicationTypes.internal}
                      onChange={(e) =>
                        onUpdateTopic(item.id, {
                          communicationTypes: {
                            ...item.communicationTypes,
                            internal: e.target.checked
                          }
                        })
                      }
                    />
                    <span className="font-medium text-slate-800">การสื่อสารภายใน</span>
                  </label>

                  <label className="mwa-checkbox-item">
                    <input
                      type="checkbox"
                      checked={item.communicationTypes.external}
                      onChange={(e) =>
                        onUpdateTopic(item.id, {
                          communicationTypes: {
                            ...item.communicationTypes,
                            external: e.target.checked
                          }
                        })
                      }
                    />
                    <span className="font-medium text-slate-800">การสื่อสารภายนอก</span>
                  </label>
                </div>
              </div>

              {/* 4. Internal Channels & Audience (When internal is checked) */}
              {item.communicationTypes.internal && (
                <div className="space-y-4 my-4 p-4 border-l-4 border-[#3498db] bg-sky-50/40 rounded-r-lg">
                  {/* Internal Channels */}
                  <div
                    id={`topic-field-internalChannels-${index + 1}`}
                    className={`transition-all ${
                      highlightedFieldId === `topic-field-internalChannels-${index + 1}`
                        ? 'p-3 rounded-lg border-2 border-rose-500 bg-rose-50/60 ring-2 ring-rose-200'
                        : ''
                    }`}
                  >
                    <label className="font-semibold text-xs text-[#0054a6] block mb-2">
                      ช่องทางการสื่อสารภายใน *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {internalChannelsList.map((ch) => (
                        <label key={ch} className="mwa-checkbox-item bg-white">
                          <input
                            type="checkbox"
                            checked={item.internalChannels.includes(ch)}
                            onChange={() => handleInternalChannelCheck(item, ch)}
                          />
                          <span>{ch === 'อื่นๆ' ? 'อื่นๆ (โปรดระบุ)' : ch}</span>
                        </label>
                      ))}
                    </div>

                    {/* Other internal channel input */}
                    {item.internalChannels.includes('อื่นๆ') && (
                      <div className="mt-2">
                        <input
                          type="text"
                          placeholder="โปรดระบุช่องทางอื่นๆ"
                          className="w-full text-xs p-2.5 border border-slate-300 rounded bg-white"
                          value={item.otherInternalChannel || ''}
                          onChange={(e) =>
                            onUpdateTopic(item.id, { otherInternalChannel: e.target.value })
                          }
                        />
                      </div>
                    )}
                  </div>

                  {/* Internal Audience */}
                  <div
                    id={`topic-field-internalAudiences-${index + 1}`}
                    className={`pt-2 border-t border-sky-100 transition-all ${
                      highlightedFieldId === `topic-field-internalAudiences-${index + 1}`
                        ? 'p-3 rounded-lg border-2 border-rose-500 bg-rose-50/60 ring-2 ring-rose-200'
                        : ''
                    }`}
                  >
                    <label className="font-semibold text-xs text-[#0054a6] block mb-2">
                      กลุ่มผู้รับสารภายใน *
                    </label>
                    {internalAudienceList.map((aud) => (
                      <div key={aud.id} className="space-y-2">
                        <label className="mwa-checkbox-item bg-white">
                          <input
                            type="checkbox"
                            checked={item.internalAudiences.includes(aud.label)}
                            onChange={() => handleInternalAudienceCheck(item, aud.label)}
                          />
                          <span>{aud.label}</span>
                        </label>
                        {item.internalAudiences.includes(aud.label) && (
                          <div className="pl-6">
                            <input
                              type="text"
                              placeholder={aud.placeholder}
                              className="w-full text-xs p-2 border border-slate-300 rounded bg-white"
                              value={item.internalAudienceDetails?.[aud.id] || ''}
                              onChange={(e) =>
                                onUpdateTopic(item.id, {
                                  internalAudienceDetails: {
                                    ...item.internalAudienceDetails,
                                    [aud.id]: e.target.value
                                  }
                                })
                              }
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. External Channels & Audience (When external is checked) */}
              {item.communicationTypes.external && (
                <div className="space-y-4 my-4 p-4 border-l-4 border-[#e67e22] bg-amber-50/40 rounded-r-lg">
                  {/* External Channels */}
                  <div
                    id={`topic-field-externalChannels-${index + 1}`}
                    className={`transition-all ${
                      highlightedFieldId === `topic-field-externalChannels-${index + 1}`
                        ? 'p-3 rounded-lg border-2 border-rose-500 bg-rose-50/60 ring-2 ring-rose-200'
                        : ''
                    }`}
                  >
                    <label className="font-semibold text-xs text-[#d35400] block mb-2">
                      ช่องทางการสื่อสารภายนอก *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {externalChannelsList.map((ch) => (
                        <label key={ch} className="mwa-checkbox-item bg-white">
                          <input
                            type="checkbox"
                            checked={item.externalChannels.includes(ch)}
                            onChange={() => handleExternalChannelCheck(item, ch)}
                          />
                          <span>{ch === 'อื่นๆ' ? 'อื่นๆ (โปรดระบุ)' : ch}</span>
                        </label>
                      ))}
                    </div>

                    {/* Other external channel input */}
                    {item.externalChannels.includes('อื่นๆ') && (
                      <div className="mt-2">
                        <input
                          type="text"
                          placeholder="โปรดระบุช่องทางอื่นๆ"
                          className="w-full text-xs p-2.5 border border-slate-300 rounded bg-white"
                          value={item.otherExternalChannel || ''}
                          onChange={(e) =>
                            onUpdateTopic(item.id, { otherExternalChannel: e.target.value })
                          }
                        />
                      </div>
                    )}
                  </div>

                  {/* External Audience */}
                  <div
                    id={`topic-field-externalAudiences-${index + 1}`}
                    className={`pt-2 border-t border-amber-100 transition-all ${
                      highlightedFieldId === `topic-field-externalAudiences-${index + 1}`
                        ? 'p-3 rounded-lg border-2 border-rose-500 bg-rose-50/60 ring-2 ring-rose-200'
                        : ''
                    }`}
                  >
                    <label className="font-semibold text-xs text-[#d35400] block mb-2">
                      กลุ่มผู้รับสารภายนอก *
                    </label>
                    <div className="space-y-2">
                      {externalAudienceList.map((aud) => (
                        <div key={aud.id} className="space-y-1.5">
                          <label className="mwa-checkbox-item bg-white">
                            <input
                              type="checkbox"
                              checked={item.externalAudiences.includes(aud.label)}
                              onChange={() => handleExternalAudienceCheck(item, aud.label)}
                            />
                            <span>{aud.label}</span>
                          </label>
                          {item.externalAudiences.includes(aud.label) && (
                            <div className="pl-6">
                              <input
                                type="text"
                                placeholder={aud.placeholder}
                                className="w-full text-xs p-2 border border-slate-300 rounded bg-white"
                                value={item.externalAudienceDetails?.[aud.id] || ''}
                                onChange={(e) =>
                                  onUpdateTopic(item.id, {
                                    externalAudienceDetails: {
                                      ...item.externalAudienceDetails,
                                      [aud.id]: e.target.value
                                    }
                                  })
                                }
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 6. Evidence files (Action Button) */}
              <div className="mwa-form-group mt-4">
                <label className="block font-semibold text-slate-800 text-sm mb-2">
                  หลักฐาน (ถ้ามี)
                </label>

                {/* Prominent Action Button: [ 📎 แนบหลักฐาน ] */}
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="file"
                    id={`evidence-${item.id}`}
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                    onChange={(e) => handleFileChange(item.id, e)}
                    disabled={(item.evidenceFiles || []).length >= 3}
                    className="hidden"
                  />
                  <label
                    htmlFor={`evidence-${item.id}`}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-semibold transition-all shadow-xs select-none ${
                      (item.evidenceFiles || []).length >= 3
                        ? 'bg-slate-100 text-slate-400 border-slate-300 cursor-not-allowed'
                        : 'bg-[#005691] hover:bg-[#004070] text-white border-[#004070] hover:shadow-md active:scale-98 cursor-pointer'
                    }`}
                  >
                    <Paperclip className="w-4 h-4 text-sky-200" />
                    <span>
                      {(item.evidenceFiles || []).length > 0
                        ? `แนบหลักฐาน (${(item.evidenceFiles || []).length} ไฟล์)`
                        : 'แนบหลักฐาน'}
                    </span>
                  </label>

                  <span className="text-xs text-slate-500">
                    (รองรับ PDF, Word, Excel, รูปภาพ • สูงสุด 5 ไฟล์)
                  </span>
                </div>

                {/* Status below Upload Area */}
                {(item.evidenceFiles || []).length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {/* List of uploaded files */}
                    <div className="space-y-1.5">
                      {item.evidenceFiles.map((file, fIdx) => {
                        const isImg =
                          file.url?.startsWith('data:image') ||
                          ['jpg', 'jpeg', 'png', 'gif', 'webp'].some((ext) =>
                            file.name.toLowerCase().endsWith(ext)
                          );
                        return (
                          <div
                            key={fIdx}
                            className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg text-xs hover:border-slate-300 transition-colors shadow-2xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 mr-2">
                              {file.previewUrl ? (
                                <img src={file.previewUrl} alt={`ภาพตัวอย่าง ${file.name}`} className="w-12 h-14 object-contain border border-slate-200 rounded bg-white shrink-0" />
                              ) : (
                                <span className="text-base select-none shrink-0" title={isImg ? 'รูปภาพ' : 'เอกสาร'}>{isImg ? '🖼️' : '📄'}</span>
                              )}
                              <div className="min-w-0">
                                <div
                                  className="font-medium text-slate-800 truncate"
                                  title={file.name}
                                >
                                  {file.name}
                                </div>
                                {file.size && (
                                  <div className="text-[11px] text-slate-500">
                                    {file.size}
                                  </div>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(item.id, fIdx)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 rounded border border-rose-200 transition-colors cursor-pointer shrink-0"
                              title="ลบไฟล์นี้"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>ลบ</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Counter status: แนบแล้ว X / 3 ไฟล์ */}
                    <div className="text-xs font-semibold text-slate-700 pl-1">
                      แนบแล้ว {(item.evidenceFiles || []).length} / 3 ไฟล์
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-slate-500 italic pl-1">
                    ยังไม่ได้แนบไฟล์
                  </div>
                )}
              </div>

                {/* 7. Additional Details */}
                <div className="mwa-form-group mt-3">
                  <label htmlFor={`additional-${item.id}`}>รายละเอียดเพิ่มเติม</label>
                  <textarea
                    id={`additional-${item.id}`}
                    placeholder="กรุณากรอกรายละเอียดเพิ่มเติม (ถ้ามี)"
                    value={item.additionalDetails || ''}
                    onChange={(e) => onUpdateTopic(item.id, { additionalDetails: e.target.value })}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Add topic button (up to 30 topics) */}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          {currentTopics.length < 30 ? (
            <button
              type="button"
              className="mwa-btn mwa-btn-primary"
              onClick={onAddTopic}
            >
              <Plus className="w-4 h-4" />
              <span>+ เพิ่มประเด็นการสื่อสาร</span>
            </button>
          ) : (
            <span className="text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 font-medium inline-block">
              เพิ่มประเด็นการสื่อสารครบตามจำนวนสูงสุด (30 ประเด็น) แล้ว
            </span>
          )}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button
          type="button"
          className="mwa-btn mwa-btn-warning"
          onClick={onPrev}
        >
          ย้อนกลับ
        </button>
        <button type="submit" className="mwa-btn mwa-btn-primary">
          ถัดไป
        </button>
      </div>
    </form>
  );
};
