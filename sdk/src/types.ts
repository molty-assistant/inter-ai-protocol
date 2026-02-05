/**
 * Inter-AI Protocol v0.2 TypeScript Types
 * Reference: https://github.com/molty-assistant/inter-ai-protocol
 */

export interface IAPSender {
  /** Unique identifier for the sending agent */
  agent_id: string;
  /** Email-style identity (e.g., agentmail) */
  email?: string;
  /** Framework the agent runs on */
  framework?: string;
  /** How to return results */
  callback?: string;
}

export interface IAPDelivery {
  /** sync = wait for response, async = webhook, email = deliver via email */
  method: 'sync' | 'async' | 'email';
  /** Webhook URL for async delivery */
  webhook?: string;
  /** Email address for email delivery */
  email?: string;
  /** Endpoint to poll for progress updates */
  status_endpoint?: string;
}

export interface IAPTask {
  /** One-line description of what you want */
  intent: string;
  /** Multi-line explanation with full context */
  details?: string;
  /** Small inline context if needed */
  context?: string;
  /** URL or file reference for large context payloads */
  context_ref?: string;
}

export interface IAPConstraints {
  /** Maximum time to spend (e.g., "30m", "2h") */
  time_limit?: string;
  /** Maximum tokens to use */
  token_budget?: number;
  /** Tools the agent is allowed to use */
  tools_allowed?: string[];
  /** Tools the agent must not use */
  tools_denied?: string[];
  /** Freeform scope limitations */
  scope?: string;
  /** Capabilities required - fail fast if missing */
  requires_capabilities?: string[];
}

export interface IAPOutput {
  /** Expected output format */
  format: 'markdown' | 'json' | 'yaml' | 'code' | 'freeform';
  /** JSON schema if format is json */
  schema?: string;
  /** Where to deliver output (file://, URL, or "inline") */
  deliver_to?: string;
}

export interface IAPOnFailure {
  /** What to do on failure */
  action: 'return_partial' | 'retry' | 'escalate' | 'abort';
  /** Number of retries if action is retry */
  max_retries?: number;
  /** Who to escalate to if action is escalate */
  escalate_to?: string;
}

export interface IAPTaskHandoff {
  /** Protocol version */
  iap_version: '0.2';
  /** Unique task identifier */
  task_id: string;
  /** Who is asking */
  sender: IAPSender;
  /** How to deliver (optional, defaults to sync) */
  delivery?: IAPDelivery;
  /** What needs doing */
  task: IAPTask;
  /** Constraints (optional) */
  constraints?: IAPConstraints;
  /** Success criteria (optional) */
  success_criteria?: string[];
  /** Output format (optional) */
  output?: IAPOutput;
  /** Failure handling (optional) */
  on_failure?: IAPOnFailure;
}

export interface IAPTaskResult {
  /** Original task ID */
  task_id: string;
  /** Status of the task */
  status: 'complete' | 'partial' | 'failed' | 'in_progress';
  /** The output/result */
  result?: unknown;
  /** Error message if failed */
  error?: string;
  /** Which success criteria were met */
  criteria_met?: string[];
  /** Which success criteria were not met */
  criteria_unmet?: string[];
  /** Metadata */
  metadata?: {
    started_at?: string;
    completed_at?: string;
    tokens_used?: number;
    agent_id?: string;
  };
}

export interface IAPValidationError {
  path: string;
  message: string;
}
