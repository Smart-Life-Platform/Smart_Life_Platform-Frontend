import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { UilArrowRight, UilPlus, UilRobot, UilTrashAlt } from '@iconscout/react-unicons';
import { useAuth } from '../context/AuthContext';
import { useTaskContext } from '../context/TaskContext';
import { getDisplayName } from '../components/common/Avatar';
import {
  deleteConversation,
  getConversation,
  getConversations,
  sendMessage,
} from '../api/assistantApi';
import '../styles/assistant.css';

const SUGGESTIONS = [
  'What tasks do I have due this week?',
  "Create a task 'Complete API documentation' with high priority due Friday",
  'Show me all my boards',
  'Add milk to my Groceries list',
];

const toMessage = (message) => ({
  id: message.id || `message-${Math.random().toString(36).slice(2)}`,
  role: message.role === 'user' ? 'user' : 'assistant',
  content: message.content || '',
  action: message.metadata?.action || null,
});

export default function AssistantPage() {
  const { user } = useAuth();
  const { loadTasks, loadMetadata } = useTaskContext();
  const location = useLocation();
  const navigate = useNavigate();

  // A task card can open the assistant with a prepared question ("send to assistant").
  const pendingPrompt = useRef(location.state?.assistantPrompt || '');

  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [error, setError] = useState('');

  const threadRef = useRef(null);
  const inputRef = useRef(null);

  const firstName = getDisplayName(user).split(/\s+/)[0];

  /** The assistant changes boards, tasks and lists, so refresh what is on screen. */
  const refreshWorkspace = useCallback((action) => {
    if (!action) return;
    if (action.includes('board')) {
      loadMetadata().catch(() => {});
      loadTasks().catch(() => {});
      return;
    }
    if (action.includes('task')) loadTasks().catch(() => {});
  }, [loadMetadata, loadTasks]);

  const openConversation = useCallback(async (id) => {
    setActiveId(id);
    setMessages([]);
    setError('');
    setLoadingThread(true);
    try {
      const data = await getConversation(id);
      setMessages((data?.messages || []).map(toMessage));
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoadingThread(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const list = await getConversations();
        if (cancelled) return;
        setConversations(list);
        if (list.length && !pendingPrompt.current) {
          setActiveId(list[0].id);
          setLoadingThread(true);
          const data = await getConversation(list[0].id);
          if (!cancelled) setMessages((data?.messages || []).map(toMessage));
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError.message);
      } finally {
        if (!cancelled) {
          setLoadingList(false);
          setLoadingThread(false);
        }
      }

      if (pendingPrompt.current && !cancelled) {
        const prompt = pendingPrompt.current;
        pendingPrompt.current = '';
        // Drop the router state so a refresh does not ask the same question again.
        navigate(location.pathname, { replace: true });
        handleSend(prompt);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const node = threadRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, sending]);

  function startNewChat() {
    setActiveId(null);
    setMessages([]);
    setError('');
    setInput('');
    inputRef.current?.focus();
  }

  async function removeConversation(id) {
    if (!window.confirm('Delete this conversation with the assistant?')) return;
    try {
      await deleteConversation(id);
      setConversations((current) => current.filter((conversation) => conversation.id !== id));
      if (activeId === id) {
        setActiveId(null);
        setMessages([]);
      }
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  async function handleSend(text = input) {
    const content = text.trim();
    if (!content || sending) return;

    setError('');
    setInput('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
    setSending(true);

    const localId = `local-${Date.now()}`;
    setMessages((current) => [...current, { id: localId, role: 'user', content }]);

    try {
      const result = await sendMessage({ message: content, conversationId: activeId });
      setMessages((current) => [
        ...current,
        {
          id: `reply-${Date.now()}`,
          role: 'assistant',
          content: result?.response || '',
          action: result?.action || null,
        },
      ]);

      if (result?.conversation_id && result.conversation_id !== activeId) {
        setActiveId(result.conversation_id);
      }
      getConversations().then(setConversations).catch(() => {});
      refreshWorkspace(result?.action);
    } catch (sendError) {
      // Put the question back so it can be sent again once the problem is fixed.
      setMessages((current) => current.filter((message) => message.id !== localId));
      setInput(content);
      setError(sendError.message);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  function resizeComposer() {
    const node = inputRef.current;
    if (!node) return;
    node.style.height = 'auto';
    node.style.height = `${Math.min(node.scrollHeight, 120)}px`;
  }

  return (
    <div className="workspace-page assistant-page">
      <aside className="assistant-sidebar">
        <button type="button" className="assistant-new" onClick={startNewChat}>
          <UilPlus size="15" /> New chat
        </button>

        <p className="assistant-sidebar-label">Conversations</p>
        <div className="assistant-conversation-list">
          {loadingList && <p className="assistant-hint">Loading…</p>}
          {!loadingList && conversations.length === 0 && (
            <p className="assistant-hint">No conversations yet.</p>
          )}
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`assistant-conversation${conversation.id === activeId ? ' active' : ''}`}
            >
              <button
                type="button"
                className="assistant-conversation-open"
                onClick={() => openConversation(conversation.id)}
                title={conversation.title || 'Conversation'}
              >
                <span>{conversation.title || 'New conversation'}</span>
              </button>
              <button
                type="button"
                className="assistant-conversation-delete"
                onClick={() => removeConversation(conversation.id)}
                aria-label={`Delete ${conversation.title || 'conversation'}`}
              >
                <UilTrashAlt size="14" />
              </button>
            </div>
          ))}
        </div>
      </aside>

      <section className="assistant-chat">
        <header className="assistant-chat-header">
          <span className="assistant-avatar"><UilRobot size="18" /></span>
          <div>
            <h1>AI assistant</h1>
            <p>Tasks, boards and shopping lists in plain language.</p>
          </div>
        </header>

        <div className="assistant-thread" ref={threadRef} aria-live="polite">
          {loadingThread && <p className="assistant-hint">Loading conversation…</p>}

          {!loadingThread && messages.length === 0 && (
            <div className="assistant-empty">
              <span className="assistant-empty-icon"><UilRobot size="24" /></span>
              <h2>How can I help, {firstName}?</h2>
              <p>I can create tasks and boards, tell you what is due, and manage shopping lists.</p>
              <div className="assistant-suggestions">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    type="button"
                    key={suggestion}
                    onClick={() => handleSend(suggestion)}
                    disabled={sending}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={`assistant-message ${message.role}`}>
              {message.role === 'assistant' && (
                <span className="assistant-avatar small"><UilRobot size="14" /></span>
              )}
              <div className="assistant-bubble">
                <div className="assistant-text">{message.content}</div>
                {message.action && (
                  <span className="assistant-action">{message.action.replace(/_/g, ' ')}</span>
                )}
              </div>
            </div>
          ))}

          {sending && (
            <div className="assistant-message assistant">
              <span className="assistant-avatar small"><UilRobot size="14" /></span>
              <div className="assistant-bubble assistant-typing" aria-label="Assistant is typing">
                <i /><i /><i />
              </div>
            </div>
          )}
        </div>

        {error && <p className="assistant-error" role="alert">{error}</p>}

        <form
          className="assistant-composer"
          onSubmit={(event) => { event.preventDefault(); handleSend(); }}
        >
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            placeholder="Ask the assistant…"
            aria-label="Message the assistant"
            onChange={(event) => { setInput(event.target.value); resizeComposer(); }}
            onKeyDown={handleKeyDown}
          />
          <button
            type="submit"
            className="assistant-send"
            disabled={!input.trim() || sending}
            aria-label="Send message"
          >
            <UilArrowRight size="17" />
          </button>
        </form>
      </section>
    </div>
  );
}
