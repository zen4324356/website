import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Email } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mail, Clock, User, Forward, Users, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface EmailDetailSidebarProps {
  email: Email | null;
  isOpen: boolean;
  onClose: () => void;
}

const EmailDetailSidebar = ({ email, isOpen, onClose }: EmailDetailSidebarProps) => {
  if (!email) return null;

  const [isRendering, setIsRendering] = useState(true);
  const [contentError, setContentError] = useState<string | null>(null);
  const [processedBody, setProcessedBody] = useState<string>("");
  const [showRawHeaders, setShowRawHeaders] = useState(false);
  const [showSourceHtml, setShowSourceHtml] = useState(false);
  
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
      
      // Check if there are invisible characters that need to be removed
      if (body.includes('&#8199;') || body.includes('&#847;') || body.includes('&shy;')) {
        body = body.replace(/&#8199;|&#847;|&shy;/g, '');
      }
      
      // If this is a multipart message with boundaries, extract the HTML part
      if (body.includes('Content-Type: multipart/alternative') && body.includes('boundary=')) {
        try {
          const boundaryMatch = body.match(/boundary=["']?(.*?)["']?(\s|$)/);
          if (boundaryMatch && boundaryMatch[1]) {
            const boundary = boundaryMatch[1];
            const parts = body.split('--' + boundary);
            
            // Look for HTML part
            let htmlPart = '';
            for (const part of parts) {
              if (part.includes('Content-Type: text/html')) {
                const contentStart = part.indexOf('<html');
                if (contentStart > -1) {
                  htmlPart = part.substring(contentStart);
                  break;
                } else {
                  // Look for content after headers
                  const headerEnd = part.indexOf('\r\n\r\n');
                  if (headerEnd > -1) {
                    htmlPart = part.substring(headerEnd + 4);
                    break;
                  }
                }
              }
            }
            
            if (htmlPart) {
              body = htmlPart;
            }
          }
        } catch (e) {
          console.error("Error extracting multipart content:", e);
          // Continue with original body
        }
      }
      
      // First preserve all links with their attributes
      let cleanedBody = body;
      
      // If body is just plain text without HTML tags, wrap it in a div
      if (!body.includes('<') || !body.includes('>')) {
        cleanedBody = `<div style="white-space: pre-wrap; font-family: Arial, sans-serif; line-height: 1.6; color: #FFFFFF;">${body.replace(/\n/g, '<br>')}</div>`;
      }
      
      // Ensure all content is properly contained
      cleanedBody = `<div style="max-width: 100%; overflow-x: hidden; word-wrap: break-word;">${cleanedBody}</div>`;
      
      // Replace <a> tags with properly formatted ones but keep the href attributes
      cleanedBody = cleanedBody.replace(/<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1/gi, 
        (match, quote, url) => `<a href=${quote}${url}${quote} target="_blank" rel="noopener noreferrer" style="color: #0071eb; text-decoration: underline;"`
      );
      
      // Make sure all buttons are visible and properly styled
      // First, fix buttons that have inline styles - NEVER hide or blur buttons
      cleanedBody = cleanedBody.replace(/<button(.*?)style="[^"]*"/gi, 
        (match, attrs) => `<button ${attrs} style="display: inline-block !important; visibility: visible !important; opacity: 1 !important; background-color: #e50914; color: white; padding: 12px 24px; border-radius: 4px; font-weight: bold; margin: 10px 0; cursor: pointer; border: none; text-decoration: none;"`
      );
      
      // Then handle buttons without styles
      cleanedBody = cleanedBody.replace(/<button\s+([^>]*?)>/gi, (match, attrs) => {
        if (!attrs.includes('style=')) {
          return `<button ${attrs} style="display: inline-block !important; visibility: visible !important; opacity: 1 !important; background-color: #e50914; color: white; padding: 12px 24px; border-radius: 4px; font-weight: bold; margin: 10px 0; cursor: pointer; border: none; text-decoration: none;">`;
        }
        return match;
      });
      
      // Netflix-specific button handling for "Get Code" buttons
      cleanedBody = cleanedBody.replace(/<a\s+(?:[^>]*?\s+)?class=["']button["']/gi, 
        '<a style="display: inline-block !important; visibility: visible !important; opacity: 1 !important; background-color: #e50914; color: white; text-align: center; padding: 12px 24px; border-radius: 4px; font-weight: bold; margin: 10px 0; text-decoration: none;"'
      );
      
      // Handle any <a> tag with href containing "get" or "code" to ensure they're visible
      cleanedBody = cleanedBody.replace(/<a\s+(?:[^>]*?\s+)?href=(["'])(.*?(?:get|code).*?)\1/gi, 
        (match, quote, url) => `<a href=${quote}${url}${quote} target="_blank" rel="noopener noreferrer" style="display: inline-block !important; visibility: visible !important; opacity: 1 !important; color: #e50914; background-color: #fff; border: 2px solid #e50914; padding: 10px 20px; border-radius: 4px; font-weight: bold; margin: 10px 0; text-decoration: none;"`
      );
      
      // Ensure "Get Code" text in buttons has proper styling
      cleanedBody = cleanedBody.replace(/>(Get[^\<]*Code)</gi, 
        ' style="display: block !important; visibility: visible !important; opacity: 1 !important; width: 100%; max-width: 300px; margin: 20px auto; background-color: #e50914; color: white; text-align: center; padding: 15px 0; border-radius: 4px; font-weight: bold; text-decoration: none;">$1<'
      );
      
      // Remove any CSS that might hide buttons
      cleanedBody = cleanedBody.replace(/(visibility\s*:\s*hidden|display\s*:\s*none|opacity\s*:\s*0)/gi, "visibility: visible !important; display: inline-block !important; opacity: 1 !important");
      
      // Apply consistent text formatting
      cleanedBody = cleanedBody.replace(/<p/gi, '<p style="margin-bottom: 16px; line-height: 1.6; color: #0071eb; text-align: left;"');
      cleanedBody = cleanedBody.replace(/<div/gi, '<div style="margin-bottom: 16px; line-height: 1.6; color: #0071eb; text-align: left;"');
      cleanedBody = cleanedBody.replace(/<span/gi, '<span style="color: #0071eb; text-align: left;"');
      
      // Ensure all tables and their contents are properly aligned
      cleanedBody = cleanedBody.replace(/<table/gi, '<table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; text-align: left;"');
      cleanedBody = cleanedBody.replace(/<td/gi, '<td style="padding: 8px; text-align: left; color: #0071eb;"');
      cleanedBody = cleanedBody.replace(/<th/gi, '<th style="padding: 8px; text-align: left; font-weight: bold; color: #0071eb;"');
      cleanedBody = cleanedBody.replace(/<tr/gi, '<tr style="border-bottom: 1px solid #eee;"');
      
      // Style headings for consistency
      cleanedBody = cleanedBody.replace(/<h1/gi, '<h1 style="color: #0071eb; margin-top: 24px; margin-bottom: 16px; font-size: 24px; text-align: left;"');
      cleanedBody = cleanedBody.replace(/<h2/gi, '<h2 style="color: #0071eb; margin-top: 20px; margin-bottom: 12px; font-size: 20px; text-align: left;"');
      cleanedBody = cleanedBody.replace(/<h3/gi, '<h3 style="color: #0071eb; margin-top: 16px; margin-bottom: 10px; font-size: 18px; text-align: left;"');

      // IMPORTANT: Make sure all iframes and scripts are removed (security)
      cleanedBody = cleanedBody.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '');
      cleanedBody = cleanedBody.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
      
      // Clean all style tags but preserve content
      cleanedBody = cleanedBody.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
      
      // Highlight forwarded content sections
      const forwardedSignatures = [
        '---------- Forwarded message ---------',
        '---------- Forwarded message ----------',
        '---------- Forwarded Message ----------',
        '---------- Forwarded Message ---------',
        'Begin forwarded message:',
        '---------- Original Message ----------',
        'Original Message',
        'Forwarded Message'
      ];
      
      // Add a highlight to forwarded message sections
      forwardedSignatures.forEach(signature => {
        cleanedBody = cleanedBody.replace(
          new RegExp(signature.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi'),
          `<div style="background-color: #1a365d; border-left: 4px solid #0071eb; padding: 10px; margin: 15px 0; font-weight: bold; color: #0071eb;">${signature}</div>`
        );
      });

      // Improve display of forwarded email headers
      const headerPatterns = [
        /From: (.*?)(?:<br|$)/gi,
        /Date: (.*?)(?:<br|$)/gi,
        /To: (.*?)(?:<br|$)/gi,
        /Subject: (.*?)(?:<br|$)/gi,
        /Cc: (.*?)(?:<br|$)/gi
      ];
      
      headerPatterns.forEach(pattern => {
        cleanedBody = cleanedBody.replace(pattern, match => 
          `<div style="background-color: #2d3748; padding: 4px 8px; margin: 2px 0; border-left: 2px solid #4a5568; color: #0071eb;">${match}</div>`
        );
      });
      
      // Replace HTML entities
      cleanedBody = cleanedBody.replace(/&nbsp;/g, ' ');
      
      // Fix for broken or incomplete HTML
      if (!cleanedBody.includes('</div>')) {
        cleanedBody += '</div>';
      }
      
      // Make sure all images are displayed
      cleanedBody = cleanedBody.replace(/<img/gi, '<img style="max-width: 100%; height: auto;"');
      
      // Ensure fixed width tables are responsive
      cleanedBody = cleanedBody.replace(/width=(["'])\d+px\1/gi, 'width="100%"');
      cleanedBody = cleanedBody.replace(/width=(["'])\d+%\1/gi, 'width="100%"');
      
      // Add Netflix's N logo if missing and message is from Netflix
      if (email.from && email.from.toLowerCase().includes('netflix') && 
          !cleanedBody.includes('netflix.com/logo') && 
          !cleanedBody.includes('<img')) {
        const netflixLogo = '<div style="margin-bottom: 16px;"><img src="https://assets.nflxext.com/us/email/logo/newDesign/logo_v2.png" alt="Netflix" style="max-width: 75px; margin-bottom: 16px;" /></div>';
        cleanedBody = netflixLogo + cleanedBody;
      }
      
      // If content is too short or appears to be empty, provide a more detailed fallback
      if ((cleanedBody.length < 100 && !cleanedBody.includes('<img')) || 
          cleanedBody.includes("No content available") ||
          cleanedBody.trim() === "<div></div>") {
        
        console.log("Email content is too short or empty, providing fallback view");
        setContentError("Email content appears to be incomplete or empty");
        
        // Create a fallback view with basic email information and any content we have
        return `<div style="padding: 20px; background-color: #553c0e; border-left: 4px solid #ffc107; margin-bottom: 20px;">
          <h3 style="color: #ffd54f; margin-top: 0;">Email Content Issue</h3>
          <p style="margin-bottom: 10px; color: #0071eb;">The email content appears to be incomplete or corrupted.</p>
          <p style="color: #0071eb;">Try downloading the email using the button above to view the complete content.</p>
        </div>
        <div style="padding: 20px; background-color: #2d3748; border-radius: 4px;">
          <p style="color: #0071eb;"><strong style="color: #0071eb;">Email Subject:</strong> ${email.subject || 'No Subject'}</p>
          <p style="color: #0071eb;"><strong style="color: #0071eb;">From:</strong> ${email.from || 'Unknown Sender'}</p>
          <p style="color: #0071eb;"><strong style="color: #0071eb;">To:</strong> ${email.to || 'Unknown Recipient'}</p>
          <p style="color: #0071eb;"><strong style="color: #0071eb;">Date:</strong> ${new Date(email.date).toLocaleString()}</p>
          ${email.isForwardedEmail ? '<p style="color: #0071eb;"><strong style="color: #0071eb;">Contains Forwarded Content:</strong> Yes</p>' : ''}
          ${email.extractedRecipients && email.extractedRecipients.length > 0 ? 
            `<p style="color: #0071eb;"><strong style="color: #0071eb;">Contains ${email.extractedRecipients.length} Recipients</strong></p>` : ''}
          <div style="margin-top: 20px; padding-top: 10px; border-top: 1px solid #4a5568;">
            <p style="color: #0071eb;"><strong style="color: #0071eb;">Content Preview:</strong></p>
            <div style="color: #0071eb;">${body.length > 5000 ? body.substring(0, 5000) + '...' : body}</div>
          </div>
        </div>`;
      }
      
      return cleanedBody.trim();
    } catch (error) {
      console.error('Error cleaning email body:', error);
      setContentError("Error displaying email content");
      return `<div style="padding: 20px; background-color: #4a2c2a; border-left: 4px solid #f44336; margin-bottom: 20px;">
        <h3 style="color: #ffcdd2; margin-top: 0;">Error Displaying Email</h3>
        <p style="margin-bottom: 10px; color: #0071eb;">There was an error processing this email's content.</p>
        <p style="color: #0071eb;">You can try downloading the raw email to view it outside the application.</p>
      </div>
      <div style="padding: 20px; background-color: #2d3748; border-radius: 4px;">
        <p style="color: #0071eb;"><strong style="color: #0071eb;">Email Subject:</strong> ${email.subject || 'No Subject'}</p>
        <p style="color: #0071eb;"><strong style="color: #0071eb;">From:</strong> ${email.from || 'Unknown Sender'}</p>
        <p style="color: #0071eb;"><strong style="color: #0071eb;">To:</strong> ${email.to || 'Unknown Recipient'}</p>
        <p style="color: #0071eb;"><strong style="color: #0071eb;">Date:</strong> ${new Date(email.date).toLocaleString()}</p>
        <div style="margin-top: 20px; padding-top: 10px; border-top: 1px solid #4a5568;">
          <p style="color: #0071eb;"><strong style="color: #0071eb;">Error Details:</strong></p>
          <pre style="background: #1a202c; padding: 10px; overflow: auto; font-size: 12px; color: #0071eb;">${error.toString()}</pre>
        </div>
      </div>`;
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

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-1/2 lg:w-1/3 bg-netflix-black border-l border-netflix-lightgray overflow-y-auto z-50 content-card">
      <div className="sticky top-0 z-10 p-4 bg-netflix-darkgray border-b border-netflix-lightgray flex justify-between items-center content-card">
        <h2 className="text-xl font-semibold text-over-video">Email Details</h2>
        <button 
          onClick={onClose} 
          className="netflix-button button-over-video">
          Close
        </button>
      </div>
      
      <div className="p-4">
        {email ? (
          <>
            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <h3 className="text-lg font-medium text-over-video">{email.subject || 'No Subject'}</h3>
              </div>
              
              <div className="grid grid-cols-[auto,1fr] gap-2 text-sm text-netflix-lightgray">
                <span className="text-blue-500">From:</span>
                <span className="text-blue-500">{email.from || 'Unknown'}</span>
                
                <span className="text-blue-500">To:</span>
                <span className="text-blue-500">{email.to || 'Unknown'}</span>
                
                <span className="text-blue-500">Date:</span>
                <span className="text-blue-500">{email.date ? new Date(email.date).toLocaleString() : 'Unknown'}</span>
              </div>
            </div>
            
            <div className="border-t border-netflix-lightgray pt-4">
              <div className="mb-4 flex justify-between">
                <h4 className="text-md font-medium text-blue-500">Content</h4>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setShowRawHeaders(!showRawHeaders)} 
                    className="netflix-button button-over-video">
                    {showRawHeaders ? 'Show Formatted' : 'Show Raw'}
                  </button>
                </div>
              </div>
              
              {showRawHeaders ? (
                <pre className="whitespace-pre-wrap bg-netflix-gray p-3 rounded text-xs overflow-x-auto">
                  {email.rawContent || email.body || 'No content available'}
                </pre>
              ) : (
                <div 
                  className="prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: cleanEmailBody(email.body || '') }}
                />
              )}
              
              {email.isForwardedEmail && (
                <div className="mt-6 border-t border-netflix-lightgray pt-4">
                  <h4 className="text-md font-medium mb-2 text-blue-500">Forwarded Content</h4>
                  <div className="bg-netflix-darkgray p-3 rounded content-card">
                    {email.forwardedContent && Array.isArray(email.forwardedContent) && email.forwardedContent.map((fwd, index) => (
                      <div key={index} className="mb-4 last:mb-0 border-b border-netflix-lightgray last:border-0 pb-4 last:pb-0">
                        <div className="grid grid-cols-[auto,1fr] gap-2 text-sm text-netflix-lightgray mb-2">
                          {fwd.from && (
                            <>
                              <span className="text-blue-500">From:</span>
                              <span className="text-blue-500">{fwd.from}</span>
                            </>
                          )}
                          
                          {fwd.to && (
                            <>
                              <span className="text-blue-500">To:</span>
                              <span className="text-blue-500">{fwd.to}</span>
                            </>
                          )}
                          
                          {fwd.subject && (
                            <>
                              <span className="text-blue-500">Subject:</span>
                              <span className="text-blue-500">{fwd.subject}</span>
                            </>
                          )}
                          
                          {fwd.date && (
                            <>
                              <span className="text-blue-500">Date:</span>
                              <span className="text-blue-500">{fwd.date}</span>
                            </>
                          )}
                        </div>
                        
                        <div 
                          className="prose prose-invert max-w-none text-sm"
                          dangerouslySetInnerHTML={{ __html: cleanEmailBody(fwd.body || '') }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex justify-center items-center h-64">
            <p className="text-netflix-lightgray text-over-video">Select an email to view details</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailDetailSidebar;
