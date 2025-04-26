import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Email } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mail, Clock, User, Download, Forward, Users, AlertTriangle, X, Reply, Star, Archive, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";

interface EmailDetailSidebarProps {
  email: Email | null;
  isOpen: boolean;
  onClose: () => void;
}

const EmailDetailSidebar = ({ email, isOpen, onClose }: EmailDetailSidebarProps) => {
  const [emailContent, setEmailContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRendering, setIsRendering] = useState(true);
  const [contentError, setContentError] = useState<string | null>(null);
  const [processedBody, setProcessedBody] = useState<string>("");
  const [showRawHeaders, setShowRawHeaders] = useState(false);
  const [showSourceHtml, setShowSourceHtml] = useState(false);
  const [showRawHtml, setShowRawHtml] = useState(false);
  
  useEffect(() => {
    let mounted = true;

    const loadEmailContent = async () => {
      if (!email?.tempId || !isOpen) return;

      setIsLoading(true);
      try {
        const response = await fetch(`/api/emails/temp/${email.tempId}`);
        if (!response.ok) throw new Error('Failed to load email content');
        
        const content = await response.text();
        if (mounted) {
          setEmailContent(content);
        }
    } catch (error) {
        console.error('Error loading email content:', error);
        toast({
          title: "Error",
          description: "Failed to load email content. Please try again.",
          variant: "destructive"
        });
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadEmailContent();

    return () => {
      mounted = false;
      // Clean up temp file when closing
      if (email?.tempId) {
        fetch(`/api/emails/temp/${email.tempId}`, { method: 'DELETE' })
          .catch(error => console.error('Error cleaning up temp email:', error));
      }
    };
  }, [email?.tempId, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setIsRendering(true);
      setContentError(null);
      setShowRawHeaders(false);
      setShowSourceHtml(false);
      
      // Process the email body as soon as the sidebar opens
      try {
        if (email && email.body) {
          // First, check if we need to initially download the email
          if (email.rawContent) {
            // We already have the raw content, process it
            const cleaned = cleanEmailBody(email.body);
            setProcessedBody(cleaned);
          } else {
            // Process what we have, but show a notice that more data is available
            const cleaned = cleanEmailBody(email.body);
            setProcessedBody(cleaned);
            setContentError("Email content may be incomplete. You can download the full email to view all content.");
          }
        } else {
          setContentError("No email content available");
          setProcessedBody('<div class="p-4 text-red-500 font-medium">No email content available</div>');
        }
      } catch (err) {
        console.error("Error processing email body:", err);
        setContentError("Error processing email content");
        setProcessedBody('<div class="p-4 text-red-500 font-medium">Error processing email content</div>');
      }
      
      // Set a timer to finish rendering
      const timer = setTimeout(() => {
        setIsRendering(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, email?.id, email?.body, email?.rawContent]);

  const cleanEmailBody = (body: string) => {
    try {
      // Check if the body is actually available
      if (!body || typeof body !== 'string') {
        setContentError("No email content available");
        return '<div class="p-4 text-red-500 font-medium">No email content available</div>';
      }
      
      // Convert base64 content if needed
      if (body.startsWith("ey") || body.startsWith("PG")) {
        try {
          // Try to decode as base64
          const decoded = atob(body.replace(/-/g, '+').replace(/_/g, '/'));
          if (decoded && decoded.length > 10) {
            console.log("Successfully decoded base64 email content");
            body = decoded;
          }
        } catch (e) {
          console.log("Content is not base64 encoded, proceeding with original");
        }
      }
      
      // Remove invisible characters
      body = body.replace(/&#8199;|&#847;|&shy;|&#8203;/g, '');
      
      // Handle multipart messages
      if (body.includes('Content-Type: multipart/alternative') || body.includes('Content-Type: multipart/mixed')) {
        try {
          const boundaryMatch = body.match(/boundary=["']?(.*?)["']?(\s|$)/);
          if (boundaryMatch && boundaryMatch[1]) {
            const boundary = boundaryMatch[1];
            const parts = body.split('--' + boundary);
            
            // Look for HTML part first, then plain text
            let htmlPart = '';
            let plainTextPart = '';
            
            for (const part of parts) {
              if (part.includes('Content-Type: text/html')) {
                const contentStart = part.indexOf('<html');
                if (contentStart > -1) {
                  htmlPart = part.substring(contentStart);
                } else {
                  const headerEnd = part.indexOf('\r\n\r\n');
                  if (headerEnd > -1) {
                    htmlPart = part.substring(headerEnd + 4);
                  }
                }
              } else if (part.includes('Content-Type: text/plain')) {
                const headerEnd = part.indexOf('\r\n\r\n');
                if (headerEnd > -1) {
                  plainTextPart = part.substring(headerEnd + 4);
                }
              }
            }
            
            body = htmlPart || plainTextPart;
          }
        } catch (e) {
          console.error("Error extracting multipart content:", e);
        }
      }
      
      // If body is plain text, convert to HTML
      if (!body.includes('<') || !body.includes('>')) {
        body = `<div style="white-space: pre-wrap; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">${body.replace(/\n/g, '<br>')}</div>`;
      }
      
      // Create a container for the email content
      let cleanedBody = `<div style="max-width: 100%; overflow-x: auto; word-wrap: break-word; padding: 20px; background-color: #fff; color: #333;">${body}</div>`;
      
      // Fix links
      cleanedBody = cleanedBody.replace(/<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1/gi, 
        (match, quote, url) => `<a href=${quote}${url}${quote} target="_blank" rel="noopener noreferrer" style="color: #0071eb; text-decoration: underline;"`
      );
      
      // Fix buttons
      cleanedBody = cleanedBody.replace(/<button(.*?)style="[^"]*"/gi, 
        (match, attrs) => `<button ${attrs} style="display: inline-block !important; visibility: visible !important; opacity: 1 !important; background-color: #e50914; color: white; padding: 12px 24px; border-radius: 4px; font-weight: bold; margin: 10px 0; cursor: pointer; border: none; text-decoration: none;"`
      );
      
      // Fix tables
      cleanedBody = cleanedBody.replace(/<table/gi, '<table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;"');
      cleanedBody = cleanedBody.replace(/<td/gi, '<td style="padding: 8px; border: 1px solid #ddd;"');
      cleanedBody = cleanedBody.replace(/<th/gi, '<th style="padding: 8px; border: 1px solid #ddd; font-weight: bold;"');
      
      // Fix images
      cleanedBody = cleanedBody.replace(/<img/gi, '<img style="max-width: 100%; height: auto;"');
      
      // Remove potentially dangerous content
      cleanedBody = cleanedBody.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '');
      cleanedBody = cleanedBody.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
      cleanedBody = cleanedBody.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
      
      // Ensure proper text formatting
      cleanedBody = cleanedBody.replace(/<p/gi, '<p style="margin-bottom: 16px; line-height: 1.6;"');
      cleanedBody = cleanedBody.replace(/<div/gi, '<div style="margin-bottom: 16px; line-height: 1.6;"');
      
      // Fix headings
      cleanedBody = cleanedBody.replace(/<h1/gi, '<h1 style="font-size: 24px; margin-top: 24px; margin-bottom: 16px;"');
      cleanedBody = cleanedBody.replace(/<h2/gi, '<h2 style="font-size: 20px; margin-top: 20px; margin-bottom: 12px;"');
      cleanedBody = cleanedBody.replace(/<h3/gi, '<h3 style="font-size: 18px; margin-top: 16px; margin-bottom: 10px;"');
      
      return cleanedBody;
    } catch (err) {
      console.error("Error cleaning email body:", err);
      return '<div class="p-4 text-red-500 font-medium">Error processing email content</div>';
    }
  };

  // Enhanced function to create well-formatted plain text version for download
  const createPlainTextEmail = (htmlBody: string) => {
    try {
      // If we have raw headers, include them in the download
      let rawContent = "";
      if (email.rawHeaders) {
        rawContent = email.rawHeaders + "\n\n";
      }
      
      // Create a temporary DOM element
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlBody;
      
      // Extract links for reference
      const links = tempDiv.querySelectorAll('a');
      let linkReferences = '';
      
      if (links.length > 0) {
        linkReferences = '\n\nLinks in this email:\n';
        links.forEach((link, index) => {
          linkReferences += `[${index + 1}] ${link.textContent?.trim() || 'Link'}: ${link.href}\n`;
        });
      }
      
      // Extract button text
      const buttons = tempDiv.querySelectorAll('button');
      let buttonReferences = '';
      
      if (buttons.length > 0) {
        buttonReferences = '\n\nButtons in this email:\n';
        buttons.forEach((button, index) => {
          buttonReferences += `[Button ${index + 1}] ${button.textContent?.trim() || 'Button'}\n`;
        });
      }
      
      // Get the text content (removes HTML tags but preserves text)
      let plainText = tempDiv.textContent || tempDiv.innerText || '';
      
      // Clean up whitespace but maintain paragraph breaks
      plainText = plainText.replace(/\s+/g, ' ').trim()
                         .replace(/\. /g, '.\n')
                         .replace(/\! /g, '!\n')
                         .replace(/\? /g, '?\n');
      
      // If we have raw headers, use them; otherwise, create a basic header
      if (rawContent) {
        return rawContent + plainText + linkReferences + buttonReferences;
      } else {
        return `From: ${email.from}
To: ${email.to}
Subject: ${email.subject}
Date: ${new Date(email.date).toLocaleString()}

${plainText}${linkReferences}${buttonReferences}`;
      }
    } catch (error) {
      console.error('Error creating plain text version:', error);
      return `Email content could not be properly converted to plain text.
From: ${email.from}
To: ${email.to}
Subject: ${email.subject}
Date: ${new Date(email.date).toLocaleString()}

Original email may contain HTML content that could not be processed.`;
    }
  };

  // Function to extract and format raw headers for display
  const formatRawHeaders = () => {
    if (!email.rawHeaders) {
      return '<div class="text-gray-300 italic">No raw headers available</div>';
    }
    
    // Format headers for display in monospace font
    const headers = email.rawHeaders
      .split('\n')
      .map(line => {
        // Highlight key headers
        if (line.startsWith('From:') || line.startsWith('To:') || 
            line.startsWith('Subject:') || line.startsWith('Date:') ||
            line.startsWith('Delivered-To:') || line.startsWith('Return-Path:') ||
            line.startsWith('Received:') || line.startsWith('X-Forwarded-')) {
          return `<span class="text-blue-400 font-medium">${line}</span>`;
        }
        return line;
      })
      .join('<br>');
    
    return `<div class="font-mono text-xs leading-tight text-white">${headers}</div>`;
  };

  const handleDownload = () => {
    try {
      // Download the original raw email if available
      if (email.rawContent) {
        const blob = new Blob([email.rawContent], { type: 'message/rfc822' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `email-${email.id.substring(0, 8)}.eml`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return;
      }
      
      // Fall back to creating a plain text version
      const cleanedBody = cleanEmailBody(email.body);
      const plainTextBody = createPlainTextEmail(cleanedBody);
      
      const blob = new Blob([plainTextBody], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `email-${email.id.substring(0, 8)}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading email:', error);
      alert('Failed to download email. Please try again.');
    }
  };

  // Add handler for Get Code buttons
  const handleGetCode = (e: React.MouseEvent<HTMLElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('.get-code-button, .get-code-link')) {
      e.preventDefault();
      // Ensure the button is visible and clickable
      target.style.display = 'inline-block';
      target.style.visibility = 'visible';
      target.style.opacity = '1';
      
      // If it's a link, open in new tab
      const link = target.closest('a');
      if (link) {
        window.open(link.href, '_blank', 'noopener,noreferrer');
      }
    }
  };

  // Function to safely render HTML content
  const renderEmailContent = () => {
    if (!email.body) return null;

    // Create safe styles for email content
    const safeStyles = `
      <style>
        .email-wrapper {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #FFFFFF;
          max-width: 100%;
          overflow-wrap: break-word;
        }
        .email-wrapper img {
          max-width: 100%;
          height: auto;
        }
        .email-wrapper a {
          color: #0071eb;
          text-decoration: underline;
        }
        .email-wrapper table {
          width: 100%;
          border-collapse: collapse;
          margin: 10px 0;
        }
        .email-wrapper td, .email-wrapper th {
          padding: 8px;
          border: 1px solid #404040;
        }
        .email-wrapper button, 
        .email-wrapper .button {
          display: inline-block !important;
          visibility: visible !important;
          opacity: 1 !important;
          background-color: #e50914;
          color: white;
          padding: 12px 24px;
          border-radius: 4px;
          font-weight: bold;
          margin: 10px 0;
          text-decoration: none;
          border: none;
          cursor: pointer;
        }
        .email-wrapper div {
          margin: 10px 0;
        }
      </style>
    `;

    // Combine styles with email content
    const fullContent = `
      ${safeStyles}
      <div class="email-wrapper">
        ${email.body}
      </div>
    `;

    return fullContent;
  };

  if (!isOpen || !email) return null;

  return (
    <div className="fixed right-0 top-0 h-screen w-[600px] bg-netflix-black border-l border-netflix-gray overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-netflix-gray flex items-center justify-between bg-netflix-darkgray sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          <span className="font-semibold">Email View</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRawHtml(!showRawHtml)}
            className="p-2 hover:bg-netflix-gray rounded-full"
            title={showRawHtml ? "Show Formatted" : "Show Raw HTML"}
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-netflix-gray rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Action buttons */}
      <div className="p-2 border-b border-netflix-gray flex gap-2 bg-netflix-darkgray sticky top-[64px] z-10">
        <button className="p-2 hover:bg-netflix-gray rounded-full" title="Archive">
          <Archive className="h-4 w-4" />
        </button>
        <button className="p-2 hover:bg-netflix-gray rounded-full" title="Delete">
          <Trash2 className="h-4 w-4" />
        </button>
        <button className="p-2 hover:bg-netflix-gray rounded-full" title="Star">
          <Star className="h-4 w-4" />
        </button>
        <button className="p-2 hover:bg-netflix-gray rounded-full" title="Reply">
          <Reply className="h-4 w-4" />
        </button>
        <button className="p-2 hover:bg-netflix-gray rounded-full" title="Forward">
          <Forward className="h-4 w-4" />
        </button>
      </div>

      {/* Email content */}
      <div className="flex-1 overflow-auto">
        <div className="p-4">
          {/* Subject */}
          <h1 className="text-xl font-semibold mb-4">{email.subject}</h1>

          {/* Sender info */}
          <div className="flex items-start gap-3 mb-4 bg-netflix-darkgray p-3 rounded">
            <div className="w-10 h-10 rounded-full bg-netflix-red flex items-center justify-center">
              <span className="text-white font-semibold text-lg">
                {email.from.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="font-semibold text-lg">{email.from}</div>
              <div className="text-sm text-gray-400">
                to {email.to}
              </div>
              <div className="text-sm text-gray-400">
                {new Date(email.date).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Email body */}
          <div className="mt-4 bg-netflix-darkgray p-4 rounded">
            {showRawHtml ? (
              <pre className="whitespace-pre-wrap text-sm font-mono overflow-x-auto">
                {email.body}
              </pre>
            ) : (
              <div 
                className="prose prose-invert max-w-none email-content"
                dangerouslySetInnerHTML={{ __html: renderEmailContent() }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailDetailSidebar;
