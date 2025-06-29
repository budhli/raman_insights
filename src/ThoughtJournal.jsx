import React, { useState, useEffect, useRef } from 'react';

// ThoughtJournal that shows cards sequentially when triggered
const ThoughtJournal = ({ 
  currentLessonIndex, 
  t,
  isVisible = true,
  triggerNewCards = false,
  onClose = null
}) => {
  const [visibleCards, setVisibleCards] = useState([]);
  const [animatingCards, setAnimatingCards] = useState(new Set());
  const previousLessonIndex = useRef(currentLessonIndex);

  const thoughtJournalData = t('thoughtJournal') || {};
  const themes = thoughtJournalData.themes || {};
  const lessons = thoughtJournalData.lessons || {};
  const ui = thoughtJournalData.ui || {};

  // Handle lesson index changes (for backward navigation and initial load)
  useEffect(() => {
    console.log('📚 Lesson changed:', {
      currentLessonIndex,
      previousLessonIndex: previousLessonIndex.current
    });
    
    const isMovingBackward = currentLessonIndex < previousLessonIndex.current;
    
    if (isMovingBackward) {
      console.log('⬅️ Moving backward');
      // Moving backward - show all cards up to current lesson immediately
      showAllCardsUpToLesson(currentLessonIndex);
    } else if (previousLessonIndex.current === undefined) {
      console.log('🔄 Initial load');
      // Initial load - don't show any cards automatically
      setVisibleCards([]);
    }

    previousLessonIndex.current = currentLessonIndex;
  }, [currentLessonIndex]);

  // Handle trigger for new cards - simplified logic
  useEffect(() => {
    console.log('🔍 ThoughtJournal trigger check:', {
      triggerNewCards,
      currentLessonIndex,
      isVisible
    });
    
    if (triggerNewCards && isVisible) {
      console.log('✨ Adding new lesson cards for lesson:', currentLessonIndex);
      addNewLessonCards(currentLessonIndex);
    }
  }, [triggerNewCards, isVisible]);

  const showAllCardsUpToLesson = (lessonIndex) => {
    let allCards = [];
    
    for (let i = 0; i <= lessonIndex; i++) {
      const lessonKey = `lesson${i + 1}`;
      const lesson = lessons[lessonKey];
      if (lesson && lesson.cards) {
        const lessonTheme = themes[lesson.theme] || {};
        lesson.cards.forEach((card, cardIndex) => {
          allCards.push({
            ...card,
            lessonIndex: i,
            cardIndex,
            theme: lessonTheme,
            id: `${i}-${cardIndex}`,
            isNew: false
          });
        });
      }
    }

    setVisibleCards(allCards);
    setAnimatingCards(new Set());
  };

  const addNewLessonCards = (lessonIndex) => {
    console.log('🎯 addNewLessonCards called for lesson:', lessonIndex);
    const lessonKey = `lesson${lessonIndex + 1}`;
    const lesson = lessons[lessonKey];
    
    console.log('📚 Lesson data:', lesson);
    
    if (!lesson || !lesson.cards) {
      console.log('❌ No lesson or no cards found');
      return;
    }

    // Clear existing cards first
    setVisibleCards([]);
    setAnimatingCards(new Set());

    const lessonTheme = themes[lesson.theme] || {};
    const newCards = lesson.cards.map((card, cardIndex) => ({
      ...card,
      lessonIndex,
      cardIndex,
      theme: lessonTheme,
      id: `${lessonIndex}-${cardIndex}`,
      isNew: true
    }));

    console.log('🃏 New cards to add:', newCards);

    // Add cards one by one with slower, soothing delay
    newCards.forEach((card, index) => {
      setTimeout(() => {
        console.log(`✨ Adding card ${index + 1}/${newCards.length}:`, card.prompt);
        setVisibleCards(prev => [...prev, card]);
        setAnimatingCards(prev => new Set([...prev, card.id]));
        
        // Remove animation state after animation completes
        setTimeout(() => {
          setAnimatingCards(prev => {
            const newSet = new Set(prev);
            newSet.delete(card.id);
            return newSet;
          });
          
          setVisibleCards(prev => 
            prev.map(c => c.id === card.id ? { ...c, isNew: false } : c)
          );
        }, 1200); // Longer animation duration
        
      }, index * 1500); // Much slower: 1.5 seconds between each card
    });
  };

  const ThoughtCard = ({ card, index }) => {
    const isAnimating = animatingCards.has(card.id);
    
    const cardStyle = {
      backgroundColor: 'white',
      borderLeft: `4px solid ${card.theme.color || '#3B82F6'}`,
      borderRadius: '8px',
      padding: '16px',
      marginBottom: ui.cardSpacing || '12px',
      boxShadow: isAnimating ? '0 4px 20px rgba(59, 130, 246, 0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
      transform: card.isNew && isAnimating ? 'translateX(100%)' : 'translateX(0)',
      opacity: card.isNew && isAnimating ? 0 : 1,
      animation: card.isNew && isAnimating ? `slideInRight ${ui.animationDuration || '500ms'} ease-out forwards` : 'none',
      transition: 'all 0.3s ease'
    };

    const iconStyle = {
      fontSize: '20px',
      marginRight: '12px',
      flexShrink: 0
    };

    const promptStyle = {
      fontSize: '14px',
      lineHeight: '1.5',
      color: '#374151',
      margin: 0
    };

    const themeStyle = {
      fontSize: '11px',
      color: card.theme.color || '#3B82F6',
      fontWeight: '500',
      marginBottom: '4px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    };

    const lessonBadgeStyle = {
      fontSize: '10px',
      color: '#6B7280',
      backgroundColor: '#F3F4F6',
      padding: '2px 6px',
      borderRadius: '4px',
      marginBottom: '8px',
      display: 'inline-block'
    };

    return (
      <div style={cardStyle} className={isAnimating ? 'thought-card-new' : 'thought-card'}>
        <div style={lessonBadgeStyle}>
          Lesson {card.lessonIndex + 1}
        </div>
        <div style={themeStyle}>
          {card.theme.name || 'Reflection'}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          <span style={iconStyle}>{card.icon}</span>
          <p style={promptStyle}>{card.prompt}</p>
        </div>
      </div>
    );
  };

  if (!isVisible || visibleCards.length === 0) {
    return null;
  }

  const containerStyle = {
    position: 'fixed',
    top: '20px',
    right: '20px',
    width: '320px',
    maxHeight: 'calc(100vh - 40px)',
    overflowY: 'auto',
    zIndex: 10,
    padding: '16px',
    paddingTop: '40px', // Extra space for close button
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '12px',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  };

  const headerStyle = {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: '16px',
    textAlign: 'center',
    borderBottom: '1px solid #E5E7EB',
    paddingBottom: '8px'
  };

  const progressStyle = {
    fontSize: '12px',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: '12px'
  };

  const lessonProgressStyle = {
    fontSize: '11px',
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: '8px'
  };

  return (
    <>
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes glow {
          0% { box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          50% { box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4); }
          100% { box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        }

        .thought-card-new {
          animation: glow ${ui.glowDuration || '3000ms'} ease-in-out;
        }

        .thought-journal-container::-webkit-scrollbar {
          width: 6px;
        }

        .thought-journal-container::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.1);
          border-radius: 3px;
        }

        .thought-journal-container::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.2);
          border-radius: 3px;
        }

        .thought-journal-container::-webkit-scrollbar-thumb:hover {
          background: rgba(0,0,0,0.3);
        }
      `}</style>

      <div style={containerStyle} className="thought-journal-container">
        {/* Close button */}
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          cursor: 'pointer',
          padding: '4px',
          borderRadius: '50%',
          backgroundColor: 'rgba(107, 114, 128, 0.1)',
          color: '#6B7280',
          fontSize: '18px',
          lineHeight: '1',
          transition: 'all 0.2s ease',
          zIndex: 11
        }}
        onClick={onClose}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = 'rgba(107, 114, 128, 0.2)';
          e.target.style.color = '#374151';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = 'rgba(107, 114, 128, 0.1)';
          e.target.style.color = '#6B7280';
        }}
        title="Close reflection journal"
        >
          ×
        </div>

        <div style={headerStyle}>
          💭 Your Reflection Journey
        </div>
        
        <div style={progressStyle}>
          {visibleCards.length} insights collected
        </div>

        <div style={lessonProgressStyle}>
          Through lesson {currentLessonIndex + 1}
        </div>

        <div>
          {visibleCards.map((card, index) => (
            <ThoughtCard 
              key={card.id}
              card={card}
              index={index}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default ThoughtJournal;