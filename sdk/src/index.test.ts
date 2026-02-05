/**
 * Tests for Inter-AI Protocol SDK
 * Run with: npm test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  validate,
  isValid,
  createTask,
  createResult,
  TaskBuilder,
  parse,
  toJSON,
  generateTaskId,
} from './index.js';

describe('validate', () => {
  it('rejects non-objects', () => {
    const errors = validate(null);
    assert.strictEqual(errors.length, 1);
    assert.strictEqual(errors[0].message, 'Task must be an object');
  });

  it('rejects missing iap_version', () => {
    const errors = validate({ task_id: 'test', sender: { agent_id: 'a' }, task: { intent: 'x' } });
    assert.ok(errors.some(e => e.path === 'iap_version'));
  });

  it('rejects missing task_id', () => {
    const errors = validate({ iap_version: '0.2', sender: { agent_id: 'a' }, task: { intent: 'x' } });
    assert.ok(errors.some(e => e.path === 'task_id'));
  });

  it('rejects missing sender.agent_id', () => {
    const errors = validate({ iap_version: '0.2', task_id: 'test', sender: {}, task: { intent: 'x' } });
    assert.ok(errors.some(e => e.path === 'sender.agent_id'));
  });

  it('rejects missing task.intent', () => {
    const errors = validate({ iap_version: '0.2', task_id: 'test', sender: { agent_id: 'a' }, task: {} });
    assert.ok(errors.some(e => e.path === 'task.intent'));
  });

  it('accepts minimal valid task', () => {
    const errors = validate({
      iap_version: '0.2',
      task_id: 'test',
      sender: { agent_id: 'a' },
      task: { intent: 'Do something' },
    });
    assert.strictEqual(errors.length, 0);
  });

  it('validates delivery method', () => {
    const errors = validate({
      iap_version: '0.2',
      task_id: 'test',
      sender: { agent_id: 'a' },
      task: { intent: 'x' },
      delivery: { method: 'invalid' },
    });
    assert.ok(errors.some(e => e.path === 'delivery.method'));
  });

  it('requires webhook for async delivery', () => {
    const errors = validate({
      iap_version: '0.2',
      task_id: 'test',
      sender: { agent_id: 'a' },
      task: { intent: 'x' },
      delivery: { method: 'async' },
    });
    assert.ok(errors.some(e => e.path === 'delivery.webhook'));
  });
});

describe('isValid', () => {
  it('returns true for valid task', () => {
    const task = createTask({
      sender: { agent_id: 'test' },
      task: { intent: 'Do something' },
    });
    assert.strictEqual(isValid(task), true);
  });

  it('returns false for invalid task', () => {
    assert.strictEqual(isValid({}), false);
  });
});

describe('createTask', () => {
  it('generates task_id if not provided', () => {
    const task = createTask({
      sender: { agent_id: 'test' },
      task: { intent: 'Do something' },
    });
    assert.ok(task.task_id);
    assert.strictEqual(task.iap_version, '0.2');
  });

  it('uses provided task_id', () => {
    const task = createTask({
      task_id: 'my-id',
      sender: { agent_id: 'test' },
      task: { intent: 'Do something' },
    });
    assert.strictEqual(task.task_id, 'my-id');
  });
});

describe('createResult', () => {
  it('creates result with metadata', () => {
    const result = createResult({
      task_id: 'test-123',
      status: 'complete',
      result: { data: 'hello' },
      agent_id: 'responder',
    });
    assert.strictEqual(result.task_id, 'test-123');
    assert.strictEqual(result.status, 'complete');
    assert.ok(result.metadata?.completed_at);
  });
});

describe('TaskBuilder', () => {
  it('builds minimal task', () => {
    const task = new TaskBuilder()
      .from('my-agent')
      .intent('Do something')
      .build();
    
    assert.strictEqual(task.sender.agent_id, 'my-agent');
    assert.strictEqual(task.task.intent, 'Do something');
  });

  it('builds full task', () => {
    const task = new TaskBuilder()
      .from('my-agent', 'me@agentmail.to', 'openclaw')
      .intent('Research topic')
      .details('Full details here')
      .asyncDelivery('https://webhook.com', 'https://status.com')
      .timeLimit('30m')
      .tokenBudget(5000)
      .toolsAllowed(['web_search'])
      .successCriteria(['Has sources', 'Is complete'])
      .outputFormat('markdown')
      .onFailure('return_partial')
      .build();
    
    assert.strictEqual(task.sender.email, 'me@agentmail.to');
    assert.strictEqual(task.delivery?.method, 'async');
    assert.strictEqual(task.delivery?.webhook, 'https://webhook.com');
    assert.strictEqual(task.constraints?.time_limit, '30m');
    assert.strictEqual(task.constraints?.token_budget, 5000);
    assert.deepStrictEqual(task.constraints?.tools_allowed, ['web_search']);
    assert.deepStrictEqual(task.success_criteria, ['Has sources', 'Is complete']);
    assert.strictEqual(task.output?.format, 'markdown');
    assert.strictEqual(task.on_failure?.action, 'return_partial');
  });

  it('throws without sender', () => {
    assert.throws(() => {
      new TaskBuilder().intent('test').build();
    }, /Sender is required/);
  });

  it('throws without intent', () => {
    assert.throws(() => {
      new TaskBuilder().from('agent').build();
    }, /Task intent is required/);
  });
});

describe('parse', () => {
  it('parses valid JSON', () => {
    const json = JSON.stringify({
      iap_version: '0.2',
      task_id: 'test',
      sender: { agent_id: 'a' },
      task: { intent: 'Do it' },
    });
    const task = parse(json);
    assert.strictEqual(task.task_id, 'test');
  });

  it('throws on invalid task', () => {
    assert.throws(() => {
      parse('{}');
    }, /Invalid IAP task/);
  });
});

describe('toJSON', () => {
  it('serializes task', () => {
    const task = createTask({
      sender: { agent_id: 'test' },
      task: { intent: 'Something' },
    });
    const json = toJSON(task);
    assert.ok(json.includes('"iap_version": "0.2"'));
  });
});

describe('generateTaskId', () => {
  it('generates unique IDs', () => {
    const ids = new Set();
    for (let i = 0; i < 100; i++) {
      ids.add(generateTaskId());
    }
    assert.strictEqual(ids.size, 100);
  });
});
