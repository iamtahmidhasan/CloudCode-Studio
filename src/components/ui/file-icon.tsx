'use client';

import React from 'react';

interface FileIconProps {
  filename: string;
  language?: string;
  className?: string;
}

interface FolderIconProps {
  folderName: string;
  isExpanded?: boolean;
  className?: string;
}

/**
 * Material UI / VS Code Material Icon Theme component
 * Dynamically renders authentic, razor-sharp vector SVGs based on file extension and special filenames.
 */
export function FileIcon({ filename, language, className = 'w-4 h-4 shrink-0' }: FileIconProps) {
  const lower = filename.toLowerCase().trim();
  const ext = lower.split('.').pop() || language || '';

  // 1. Exact Filename Match (Material Special Files)
  if (lower === 'package.json') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-label="package.json">
        <rect width="20" height="20" x="2" y="2" rx="3.5" fill="#CB3837" />
        <path d="M5 6H19V18H12V9H9.5V18H5V6Z" fill="#FFFFFF" />
      </svg>
    );
  }

  if (lower === 'package-lock.json') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-label="package-lock.json">
        <rect width="20" height="20" x="2" y="2" rx="3.5" fill="#CB3837" opacity="0.85" />
        <path d="M12 7c-1.1 0-2 .9-2 2v2H9v5h6v-5h-1V9c0-1.1-.9-2-2-2zm1 4h-2V9c0-.6.4-1 1-1s1 .4 1 1v2z" fill="#FFFFFF" />
      </svg>
    );
  }

  if (lower === 'pnpm-lock.yaml') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-label="pnpm-lock.yaml">
        <rect width="20" height="20" x="2" y="2" rx="3.5" fill="#F69220" />
        <rect x="5" y="5" width="4" height="4" fill="#FFFFFF" />
        <rect x="10" y="5" width="4" height="4" fill="#FFFFFF" />
        <rect x="15" y="5" width="4" height="4" fill="#FFFFFF" />
        <rect x="10" y="10" width="4" height="4" fill="#FFFFFF" />
        <rect x="15" y="10" width="4" height="4" fill="#FFFFFF" />
        <rect x="5" y="15" width="4" height="4" fill="#FFFFFF" />
        <rect x="10" y="15" width="4" height="4" fill="#FFFFFF" />
      </svg>
    );
  }

  if (lower === 'yarn.lock') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-label="yarn.lock">
        <rect width="20" height="20" x="2" y="2" rx="3.5" fill="#2C8EBB" />
        <path d="M12 6a4 4 0 0 0-4 4c0 1.5.8 2.8 2 3.5V17h4v-3.5c1.2-.7 2-2 2-3.5a4 4 0 0 0-4-4zm0 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z" fill="#FFFFFF" />
      </svg>
    );
  }

  if (lower === 'tsconfig.json' || lower.startsWith('tsconfig.') || lower.includes('.config.')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-label="Configuration">
        <path
          d="M19.4 13c.1-.3.1-.7.1-1s0-.7-.1-1l2.1-1.6c.2-.2.2-.4.1-.6l-2-3.5c-.1-.2-.4-.3-.6-.2l-2.5 1c-.5-.4-1.1-.7-1.8-.9l-.4-2.7C14.3 2.2 14.1 2 13.8 2h-4c-.3 0-.5.2-.5.5l-.4 2.7c-.6.2-1.2.6-1.8.9l-2.5-1c-.2-.1-.5 0-.6.2l-2 3.5c-.1.2-.1.4.1.6l2.1 1.6c-.1.3-.1.7-.1 1s0 .7.1 1l-2.1 1.6c-.2.2-.2.4-.1.6l2 3.5c.1.2.4.3.6.2l2.5-1c.5.4 1.1.7 1.8.9l.4 2.7c0 .3.2.5.5.5h4c.3 0 .5-.2.5-.5l.4-2.7c.6-.2 1.2-.6 1.8-.9l2.5 1c.2.1.5 0 .6-.2l2-3.5c.1-.2.1-.4-.1-.6l-2.1-1.6zM12 15.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5z"
          fill="#00BCD4"
        />
      </svg>
    );
  }

  if (lower.startsWith('.env')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-label="Environment">
        <rect width="20" height="20" x="2" y="2" rx="3.5" fill="#FFB300" />
        <path d="M12.5 7A3.5 3.5 0 0 0 9 10.5c0 1.2.6 2.3 1.5 2.9v4.6l2 2 2-2v-1l-1-1v-2.6c.9-.6 1.5-1.7 1.5-2.9A3.5 3.5 0 0 0 12.5 7zm0 2a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z" fill="#263238" />
      </svg>
    );
  }

  if (lower.startsWith('.git') || lower === '.gitignore') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-label="Git">
        <path d="M21.6 10.9L13.1 2.4C12.6 1.9 11.7 1.9 11.2 2.4L9.5 4.1L11.7 6.3C12.3 6.1 13 6.3 13.5 6.8C14 7.3 14.1 8 13.9 8.7L16.2 11C16.9 10.8 17.6 10.9 18.1 11.4C18.8 12.1 18.8 13.1 18.1 13.8C17.4 14.5 16.4 14.5 15.7 13.8C15.2 13.3 15.1 12.6 15.3 12L13.2 9.9V14.6C13.4 14.8 13.5 15.1 13.5 15.4C13.5 16.4 12.7 17.2 11.7 17.2C10.7 17.2 9.9 16.4 9.9 15.4C9.9 14.6 10.4 13.9 11.2 13.7V8.8C10.4 8.6 9.9 7.9 9.9 7.1C9.9 6.7 10 6.3 10.3 6L8.1 3.8L2.4 9.5C1.9 10 1.9 10.9 2.4 11.4L10.9 19.9C11.4 20.4 12.3 20.4 12.8 19.9L21.6 11.1C22.1 10.6 22.1 9.7 21.6 10.9Z" fill="#F05032"/>
      </svg>
    );
  }

  if (lower === 'dockerfile' || lower.startsWith('docker-compose')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-label="Docker">
        <path d="M22.5 11.5c-.3-.2-1.5-.7-2.6-.1-.2-.8-.7-1.4-1.3-1.8l-.5-.3-.3.5c-.4.7-.4 1.6-.2 2.3-.6.4-1.7.5-2.6.4H1V14c0 3.9 3.1 7 7 7 5.7 0 9.8-3.4 10.8-8.5.8 0 2-.4 2.5-1.5l.2-.5-.5-.2zM4 10h2v2H4v-2zm3 0h2v2H7v-2zm3 0h2v2h-2v-2zm3 0h2v2h-2v-2zm-6-3h2v2H7V7zm3 0h2v2h-2V7zm3 0h2v2h-2V7zm3 0h2v2h-2V7z" fill="#2496ED" />
      </svg>
    );
  }

  // 2. Extension Match
  switch (ext) {
    // HTML
    case 'html':
    case 'htm':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-label="HTML">
          <path d="M4 2.5L5.8 19.5L12 21.5L18.2 19.5L20 2.5H4Z" fill="#E44D26"/>
          <path d="M12 4V19.8L16.8 18.2L18.3 4H12Z" fill="#F16529"/>
          <path d="M7.5 7H16.5L16.2 9.5H10.1L10.3 11.5H16L15.6 15.5L12 16.5L8.4 15.5L8.2 13H6.2L6.6 17.5L12 19L17.4 17.5L18.1 7H7.5Z" fill="#FFFFFF"/>
        </svg>
      );

    // CSS
    case 'css':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-label="CSS">
          <path d="M4 2.5L5.8 19.5L12 21.5L18.2 19.5L20 2.5H4Z" fill="#1572B6"/>
          <path d="M12 4V19.8L16.8 18.2L18.3 4H12Z" fill="#33A9DC"/>
          <path d="M16.5 7H7.5L7.7 9.5H13.8L13.6 11.5H7.9L8.1 14H13.4L13 16.5L12 16.8L9.5 16.1L9.4 14.5H7.4L7.7 18L12 19.2L16.3 18L17.1 7H16.5Z" fill="#FFFFFF"/>
        </svg>
      );

    // SCSS / SASS
    case 'scss':
    case 'sass':
    case 'less':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-label="SCSS">
          <rect width="20" height="20" x="2" y="2" rx="3.5" fill="#CF649A"/>
          <text x="12" y="15" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="bold" fontFamily="system-ui, sans-serif">SCSS</text>
        </svg>
      );

    // JavaScript
    case 'js':
    case 'mjs':
    case 'cjs':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-label="JavaScript">
          <rect width="20" height="20" x="2" y="2" rx="3.5" fill="#F7DF1E"/>
          <text x="13" y="16.5" textAnchor="middle" fill="#000000" fontSize="11" fontWeight="900" fontFamily="system-ui, sans-serif" letterSpacing="-0.5px">JS</text>
        </svg>
      );

    // TypeScript
    case 'ts':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-label="TypeScript">
          <rect width="20" height="20" x="2" y="2" rx="3.5" fill="#3178C6"/>
          <text x="12" y="16.5" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="900" fontFamily="system-ui, sans-serif" letterSpacing="-0.5px">TS</text>
        </svg>
      );

    // React JSX
    case 'jsx':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-label="React JSX">
          <ellipse cx="12" cy="12" rx="9.5" ry="3.5" stroke="#61DAFB" strokeWidth="1.5" />
          <ellipse cx="12" cy="12" rx="9.5" ry="3.5" stroke="#61DAFB" strokeWidth="1.5" transform="rotate(60 12 12)" />
          <ellipse cx="12" cy="12" rx="9.5" ry="3.5" stroke="#61DAFB" strokeWidth="1.5" transform="rotate(120 12 12)" />
          <circle cx="12" cy="12" r="2" fill="#61DAFB" />
        </svg>
      );

    // React TSX
    case 'tsx':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-label="React TSX">
          <ellipse cx="11.5" cy="11.5" rx="9" ry="3.3" stroke="#00D8FF" strokeWidth="1.4" />
          <ellipse cx="11.5" cy="11.5" rx="9" ry="3.3" stroke="#00D8FF" strokeWidth="1.4" transform="rotate(60 11.5 11.5)" />
          <ellipse cx="11.5" cy="11.5" rx="9" ry="3.3" stroke="#3178C6" strokeWidth="1.4" transform="rotate(120 11.5 11.5)" />
          <circle cx="11.5" cy="11.5" r="1.8" fill="#00D8FF" />
          <rect x="13.5" y="13.5" width="8.5" height="8.5" rx="2" fill="#3178C6" />
          <text x="17.7" y="19.8" textAnchor="middle" fill="#FFFFFF" fontSize="5.5" fontWeight="900" fontFamily="system-ui, sans-serif">TS</text>
        </svg>
      );

    // Python
    case 'py':
    case 'pyw':
    case 'ipynb':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-label="Python">
          <path d="M11.9 2C8.5 2 6.5 3.5 6.5 5.7V7.5H12V8.4H4.5C2.8 8.4 2 9.8 2 12.1C2 14.5 3.2 15.6 5 15.6H6.5V13.8C6.5 11.8 8.1 10.2 10.1 10.2H14.7C16.2 10.2 17.5 8.9 17.5 7.4V5.7C17.5 3.5 15.3 2 11.9 2ZM9.3 3.8C9.9 3.8 10.4 4.3 10.4 4.9C10.4 5.5 9.9 6 9.3 6C8.7 6 8.2 5.5 8.2 4.9C8.2 4.3 8.7 3.8 9.3 3.8Z" fill="#3776AB"/>
          <path d="M12.1 22C15.5 22 17.5 20.5 17.5 18.3V16.5H12V15.6H19.5C21.2 15.6 22 14.2 22 11.9C22 9.5 20.8 8.4 19 8.4H17.5V10.2C17.5 12.2 15.9 13.8 13.9 13.8H9.3C7.8 13.8 6.5 15.1 6.5 16.6V18.3C6.5 20.5 8.7 22 12.1 22ZM14.7 20.2C14.1 20.2 13.6 19.7 13.6 19.1C13.6 18.5 14.1 18 14.7 18C15.3 18 15.8 18.5 15.8 19.1C15.8 19.7 15.3 20.2 14.7 20.2Z" fill="#FFD43B"/>
        </svg>
      );

    // C++
    case 'cpp':
    case 'cc':
    case 'cxx':
    case 'hpp':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-label="C++">
          <path d="M12 2L21 7.2V16.8L12 22L3 16.8V7.2L12 2Z" fill="#00599C"/>
          <path d="M12 3.8L19.5 8.1V15.9L12 20.2L4.5 15.9V8.1L12 3.8Z" fill="#004482"/>
          <text x="12" y="15" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="bold" fontFamily="system-ui, sans-serif">C++</text>
        </svg>
      );

    // C
    case 'c':
    case 'h':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-label="C">
          <path d="M12 2L21 7.2V16.8L12 22L3 16.8V7.2L12 2Z" fill="#659AD2"/>
          <path d="M12 3.8L19.5 8.1V15.9L12 20.2L4.5 15.9V8.1L12 3.8Z" fill="#4B7DB3"/>
          <text x="12" y="16" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="bold" fontFamily="system-ui, sans-serif">C</text>
        </svg>
      );

    // JSON
    case 'json':
    case 'jsonc':
    case 'json5':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-label="JSON">
          <rect width="20" height="20" x="2" y="2" rx="3.5" fill="#FBC02D"/>
          <text x="12" y="15.5" textAnchor="middle" fill="#000000" fontSize="11" fontWeight="bold" fontFamily="monospace">{"{ }"}</text>
        </svg>
      );

    // Markdown
    case 'md':
    case 'markdown':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-label="Markdown">
          <rect width="22" height="16" x="1" y="4" rx="3" fill="#42A5F5"/>
          <path d="M4 15V9H6L8 11.5L10 9H12V15H10.5V11.2L8.8 13.2H7.2L5.5 11.2V15H4ZM17 15L14 11.5H16V9H18V11.5H20L17 15Z" fill="#FFFFFF"/>
        </svg>
      );

    // Images
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'webp':
    case 'gif':
    case 'bmp':
    case 'ico':
    case 'tiff':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-label="Image">
          <rect width="20" height="16" x="2" y="4" rx="3" fill="#26A69A"/>
          <circle cx="8" cy="9" r="2" fill="#E0F2F1"/>
          <path d="M4 17L9 12L13 16L16 13L20 17H4Z" fill="#80CBC4"/>
        </svg>
      );

    // SVG
    case 'svg':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-label="SVG">
          <rect width="20" height="20" x="2" y="2" rx="3.5" fill="#FFB13B"/>
          <text x="12" y="14.5" textAnchor="middle" fill="#FFFFFF" fontSize="7.5" fontWeight="900" fontFamily="system-ui, sans-serif">SVG</text>
        </svg>
      );

    // YAML
    case 'yaml':
    case 'yml':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-label="YAML">
          <rect width="20" height="20" x="2" y="2" rx="3.5" fill="#AB47BC"/>
          <text x="12" y="14.5" textAnchor="middle" fill="#FFFFFF" fontSize="7" fontWeight="bold" fontFamily="monospace">YML</text>
        </svg>
      );

    // Shell Scripts
    case 'sh':
    case 'bash':
    case 'zsh':
    case 'ps1':
    case 'bat':
    case 'cmd':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-label="Shell Script">
          <rect width="20" height="16" x="2" y="4" rx="3" fill="#37474F"/>
          <path d="M6 8l4 3-4 3M12 14h5" stroke="#4CAF50" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );

    // Database / SQL
    case 'sql':
    case 'db':
    case 'sqlite':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-label="Database">
          <ellipse cx="12" cy="6" rx="8" ry="3" fill="#0288D1"/>
          <path d="M4 6v5c0 1.66 3.58 3 8 3s8-1.34 8-3V6" fill="#0277BD" stroke="#01579B" strokeWidth="0.5"/>
          <ellipse cx="12" cy="11" rx="8" ry="3" fill="#0288D1"/>
          <path d="M4 11v5c0 1.66 3.58 3 8 3s8-1.34 8-3v-5" fill="#0277BD" stroke="#01579B" strokeWidth="0.5"/>
          <ellipse cx="12" cy="16" rx="8" ry="3" fill="#03A9F4"/>
        </svg>
      );

    // PDF
    case 'pdf':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-label="PDF">
          <rect width="20" height="20" x="2" y="2" rx="3.5" fill="#E53935"/>
          <text x="12" y="14.5" textAnchor="middle" fill="#FFFFFF" fontSize="7.5" fontWeight="bold" fontFamily="system-ui, sans-serif">PDF</text>
        </svg>
      );

    // Archives / Zips
    case 'zip':
    case 'rar':
    case '7z':
    case 'tar':
    case 'gz':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-label="Archive">
          <rect width="18" height="20" x="3" y="2" rx="3" fill="#FFA726"/>
          <path d="M10 2v2h2v2h-2v2h2v2h-2v2h2v2h-2v4h4v-4h-2v-2h2v-2h-2v-2h2V8h-2V6h2V4h-2V2h-2z" fill="#FFF3E0"/>
        </svg>
      );

    // Audio / Video
    case 'mp3':
    case 'wav':
    case 'ogg':
    case 'mp4':
    case 'webm':
    case 'mov':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-label="Media">
          <rect width="20" height="16" x="2" y="4" rx="3" fill="#EC407A"/>
          <polygon points="10,8 16,12 10,16" fill="#FFFFFF"/>
        </svg>
      );

    // Default Material Document
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-label="Document">
          <path d="M6 2C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2H6Z" fill="#90A4AE" opacity="0.9"/>
          <path d="M14 2V8H20" fill="#CFD8DC"/>
          <path d="M8 12H16M8 15H16M8 18H13" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      );
  }
}

/**
 * Material UI / VS Code Material Icon Theme Folder Component
 * Supports specific folder branding (src, components, public, styles, scripts, lib, hooks, types, api, etc.)
 */
export function FolderIcon({ folderName, isExpanded = false, className = 'w-4 h-4 shrink-0' }: FolderIconProps) {
  const lower = folderName.toLowerCase().trim();

  // Color & Glyph configuration matching Material Icon Theme
  let backColor = '#F59E0B';
  let frontColor = '#FBBF24';
  let frontOpenColor = '#FCD34D';
  let glyph: React.ReactNode = null;

  if (lower === 'src' || lower === 'source') {
    backColor = '#1E88E5';
    frontColor = '#42A5F5';
    frontOpenColor = '#64B5F6';
    glyph = (
      <text x="12" y="16" textAnchor="middle" fill="#FFFFFF" fontSize="6" fontWeight="bold" fontFamily="monospace">
        &lt;&gt;
      </text>
    );
  } else if (lower === 'components') {
    backColor = '#00897B';
    frontColor = '#26A69A';
    frontOpenColor = '#4DB6AC';
    glyph = (
      <rect x="9.5" y="11.5" width="5" height="5" rx="1" fill="#FFFFFF" />
    );
  } else if (lower === 'public' || lower === 'assets' || lower === 'images' || lower === 'img') {
    backColor = '#43A047';
    frontColor = '#66BB6A';
    frontOpenColor = '#81C784';
    glyph = (
      <circle cx="12" cy="14" r="2.2" fill="#FFFFFF" />
    );
  } else if (lower === 'styles' || lower === 'css' || lower === 'theme') {
    backColor = '#D81B60';
    frontColor = '#EC407A';
    frontOpenColor = '#F06292';
    glyph = (
      <text x="12" y="16.5" textAnchor="middle" fill="#FFFFFF" fontSize="7" fontWeight="bold">
        #
      </text>
    );
  } else if (lower === 'scripts' || lower === 'js') {
    backColor = '#F57F17';
    frontColor = '#FBC02D';
    frontOpenColor = '#FDD835';
    glyph = (
      <text x="12" y="16.5" textAnchor="middle" fill="#000000" fontSize="5.5" fontWeight="900">
        JS
      </text>
    );
  } else if (lower === 'lib' || lower === 'utils' || lower === 'helpers') {
    backColor = '#FB8C00';
    frontColor = '#FFA726';
    frontOpenColor = '#FFB74D';
  } else if (lower === 'hooks') {
    backColor = '#00ACC1';
    frontColor = '#26C6DA';
    frontOpenColor = '#4DD0E1';
  } else if (lower === 'types' || lower === 'interfaces' || lower === '@types') {
    backColor = '#1565C0';
    frontColor = '#1E88E5';
    frontOpenColor = '#42A5F5';
    glyph = (
      <text x="12" y="16" textAnchor="middle" fill="#FFFFFF" fontSize="6.5" fontWeight="bold">
        T
      </text>
    );
  } else if (lower === 'api' || lower === 'routes' || lower === 'server') {
    backColor = '#5E35B1';
    frontColor = '#7E57C2';
    frontOpenColor = '#9575CD';
  } else if (lower === 'node_modules') {
    backColor = '#2E7D32';
    frontColor = '#388E3C';
    frontOpenColor = '#4CAF50';
  }

  if (isExpanded) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-label={`${folderName} (open)`}>
        <path d="M10 4H3C2.45 4 2 4.45 2 5V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 6.9 21.1 6 20 6H12L10 4Z" fill={backColor}/>
        <path d="M21.7 11.2C21.4 10.5 20.7 10 20 10H4.3C3.6 10 2.9 10.5 2.6 11.2L1 18.5C0.8 19.3 1.4 20 2.2 20H20.8C21.6 20 22.2 19.3 22 18.5L21.7 11.2Z" fill={frontOpenColor}/>
        {glyph}
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-label={`${folderName}`}>
      <path d="M10 4H3C2.45 4 2 4.45 2 5V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V8C22 6.9 21.1 6 20 6H12L10 4Z" fill={backColor}/>
      <path d="M2 9H22V19C22 20.1 21.1 21 20 21H4C2.9 21 2 20.1 2 19V9Z" fill={frontColor}/>
      {glyph}
    </svg>
  );
}
