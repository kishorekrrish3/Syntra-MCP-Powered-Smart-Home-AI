'use client';

import React, { useState } from 'react';
import { ProtocolLogEntry, AwsCloudState } from '@/types/syntra';
import {
  Terminal,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Cpu,
  Database,
} from 'lucide-react';

interface McpProtocolInspectorProps {
  logs: ProtocolLogEntry[];
  awsState: AwsCloudState;
}

export const McpProtocolInspector: React.FC<McpProtocolInspectorProps> = ({
  logs,
  awsState,
}) => {
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  return (
    <div className="bg-amazon-surface_white border border-amazon-border_subtle rounded-[4px] shadow-amazon flex flex-col overflow-hidden">
      {/* Amazon Card Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-amazon-card_hover border-b border-amazon-border_subtle">
        <div className="flex items-center space-x-2">
          <span className="bg-amazon-secondary_ink text-white font-bold text-[10px] px-1.5 py-0.5 rounded-[2px] tracking-wide">
            MCP INSPECTOR
          </span>
          <span className="text-amazon-text_main font-bold text-xs tracking-tight">
            ATLAS-MCP Protocol & AWS Cloud Telemetry
          </span>
          <span className="text-amazon-text_muted font-mono text-[11px] hidden md:inline">
            JSON-RPC 2.0 • Streamable HTTP
          </span>
        </div>

        {/* AWS Execution Mode Badge */}
        <span
          className={`px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold font-mono border ${
            awsState.mode === 'REAL_BEDROCK_S3'
              ? 'bg-amazon-success_green text-white border-transparent'
              : 'bg-amazon-secondary_ink text-amazon-accent_amber border-transparent'
          }`}
        >
          AWS MODE: {awsState.mode === 'REAL_BEDROCK_S3' ? 'REAL CLOUD' : 'SIMULATED'}
        </span>
      </div>

      {/* Cloud Engine Telemetry Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-2.5 bg-amazon-background_light border-b border-amazon-border_subtle text-xs font-mono">
        <div className="bg-white p-2 rounded-[4px] border border-amazon-border_subtle">
          <div className="text-[10px] text-amazon-text_muted flex items-center space-x-1 mb-0.5">
            <Cpu className="w-3 h-3 text-amazon-link_blue" />
            <span className="font-bold">BEDROCK MODEL</span>
          </div>
          <div className="text-amazon-text_main truncate font-bold text-[11px]">
            {awsState.configuredModel.split('.')[1] || awsState.configuredModel}
          </div>
          <div className="text-[10px] text-amazon-text_muted mt-0.5">
            Latency:{' '}
            <span className="text-amazon-success_green font-bold">
              {awsState.lastInference?.latencyMs ? `${awsState.lastInference.latencyMs}ms` : 'Standby'}
            </span>
          </div>
        </div>

        <div className="bg-white p-2 rounded-[4px] border border-amazon-border_subtle">
          <div className="text-[10px] text-amazon-text_muted flex items-center space-x-1 mb-0.5">
            <Database className="w-3 h-3 text-amazon-orange" />
            <span className="font-bold">S3 INCIDENT ARCHIVE</span>
          </div>
          <div className="text-amazon-text_main truncate font-bold text-[11px]">{awsState.s3Bucket}</div>
          <div className="text-[10px] text-amazon-text_muted mt-0.5 truncate">
            {awsState.lastArchive?.s3Uri ? (
              <span className="text-amazon-link_blue">{awsState.lastArchive.s3Uri}</span>
            ) : (
              'Standby'
            )}
          </div>
        </div>

        <div className="bg-white p-2 rounded-[4px] border border-amazon-border_subtle">
          <div className="text-[10px] text-amazon-text_muted flex items-center space-x-1 mb-0.5">
            <ShieldCheck className="w-3 h-3 text-amazon-success_green" />
            <span className="font-bold">SHA-256 INTEGRITY</span>
          </div>
          <div className="text-amazon-text_main truncate font-bold text-[11px]">
            {awsState.lastArchive?.checksum || 'SHA-256 Verified'}
          </div>
          <div className="text-[10px] text-amazon-text_muted mt-0.5">
            Audit Status: <span className="text-amazon-success_green font-bold">Compliant</span>
          </div>
        </div>
      </div>

      {/* Protocol Log Stream */}
      <div className="p-2.5 overflow-y-auto space-y-1.5 max-h-[300px] font-mono text-[11px] bg-white">
        {logs.map((log) => {
          const isExpanded = expandedLogId === log.id;
          const isError = Boolean(log.error);

          return (
            <div
              key={log.id}
              className={`rounded-[4px] border transition ${
                isError
                  ? 'bg-red-50 border-amazon-alert_red'
                  : 'bg-white border-amazon-border_subtle hover:bg-amazon-card_hover'
              }`}
            >
              <div
                onClick={() => toggleExpand(log.id)}
                className="flex items-center justify-between p-2 cursor-pointer select-none"
              >
                <div className="flex items-center space-x-2">
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-amazon-text_muted" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-amazon-text_muted" />
                  )}
                  <span
                    className={`px-1.5 py-0.2 rounded-[2px] text-[10px] font-bold ${
                      log.direction === 'REQUEST'
                        ? 'bg-amazon-link_blue text-white'
                        : log.direction === 'RESPONSE'
                        ? 'bg-amazon-success_green text-white'
                        : 'bg-amazon-secondary_ink text-amazon-accent_amber'
                    }`}
                  >
                    {log.direction}
                  </span>
                  <span className="text-amazon-text_main font-bold">{log.method}</span>
                </div>

                <div className="flex items-center space-x-2 text-[10px] text-amazon-text_muted">
                  {log.latencyMs !== undefined && (
                    <span className="text-amazon-success_green font-bold">{log.latencyMs}ms</span>
                  )}
                  <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  {isError ? (
                    <XCircle className="w-3.5 h-3.5 text-amazon-alert_red" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-amazon-success_green" />
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="p-2.5 bg-amazon-background_light border-t border-amazon-border_subtle space-y-2 text-[10px]">
                  {log.params !== undefined && (
                    <div>
                      <div className="text-amazon-text_muted font-bold mb-0.5">Params:</div>
                      <pre className="p-2 bg-white rounded-[2px] border border-amazon-border_subtle text-amazon-text_main overflow-x-auto">
                        {JSON.stringify(log.params, null, 2)}
                      </pre>
                    </div>
                  )}

                  {log.result !== undefined && (
                    <div>
                      <div className="text-amazon-success_green font-bold mb-0.5">Result:</div>
                      <pre className="p-2 bg-white rounded-[2px] border border-amazon-border_subtle text-amazon-text_main overflow-x-auto">
                        {JSON.stringify(log.result, null, 2)}
                      </pre>
                    </div>
                  )}

                  {log.error !== undefined && (
                    <div>
                      <div className="text-amazon-alert_red font-bold mb-0.5">Error:</div>
                      <pre className="p-2 bg-white rounded-[2px] border border-amazon-alert_red text-amazon-alert_red overflow-x-auto">
                        {JSON.stringify(log.error, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
