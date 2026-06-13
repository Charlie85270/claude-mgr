import { agents, saveAgents, releaseAgentTracking } from '../../core/agent-manager';
import { generateTaskFromPrompt } from '../../utils/kanban-generate';
import { RouteApp, RouteContext } from './types';

export function registerKanbanRoutes(app: RouteApp, ctx: RouteContext): void {
  // POST /api/kanban/generate
  app.post('/api/kanban/generate', async (req, sendJson) => {
    const { prompt, availableProjects } = req.body as {
      prompt: string;
      availableProjects: Array<{ path: string; name: string }>;
    };

    if (!prompt) {
      sendJson({ error: 'prompt is required' }, 400);
      return;
    }

    const task = await generateTaskFromPrompt(prompt, availableProjects);
    sendJson({ success: true, task });
  });

  // POST /api/kanban/complete
  app.post('/api/kanban/complete', async (req, sendJson) => {
    const { task_id, agent_id, session_id, summary } = req.body as {
      task_id?: string;
      agent_id?: string;
      session_id?: string;
      summary?: string;
    };

    try {
      const { loadTasks, saveTasks } = await import('../../handlers/kanban-handlers');

      const tasks = loadTasks();
      let task;

      if (task_id) {
        task = tasks.find(t => t.id === task_id);
      } else if (agent_id) {
        task = tasks.find(t => t.assignedAgentId === agent_id && t.column === 'ongoing');
      } else if (session_id) {
        let agentIdFromSession: string | undefined;
        for (const [id, agent] of agents) {
          if (agent.currentSessionId === session_id) {
            agentIdFromSession = id;
            break;
          }
        }
        if (agentIdFromSession) {
          task = tasks.find(t => t.assignedAgentId === agentIdFromSession && t.column === 'ongoing');
        }
      }

      if (!task) {
        sendJson({ success: true, message: 'No kanban task found for this agent' });
        return;
      }

      if (task.column !== 'ongoing') {
        sendJson({ success: true, message: 'Task already completed', currentColumn: task.column });
        return;
      }

      task.column = 'done';
      task.progress = 100;
      task.completedAt = new Date().toISOString();
      task.updatedAt = new Date().toISOString();
      if (summary) {
        task.completionSummary = summary;
      }

      if (task.agentCreatedForTask && task.assignedAgentId) {
        const agentToDelete = agents.get(task.assignedAgentId);
        if (agentToDelete) {
          console.log(`[Kanban] Deleting agent ${task.assignedAgentId} created for task`);
          agents.delete(task.assignedAgentId);
          releaseAgentTracking(task.assignedAgentId);
        }
      }

      saveTasks(tasks);

      if (ctx.mainWindow && !ctx.mainWindow.isDestroyed()) {
        ctx.mainWindow.webContents.send('kanban:task-updated', task);
      }

      console.log(`[Kanban] Task "${task.title}" marked as complete via hook`);
      sendJson({ success: true, task });
    } catch (err) {
      console.error('[Kanban] Failed to complete task:', err);
      sendJson({ error: 'Failed to complete task' }, 500);
    }
  });
}
