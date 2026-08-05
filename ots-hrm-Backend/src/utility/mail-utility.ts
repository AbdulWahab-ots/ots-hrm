// src/utils/mailService.ts
import nodemailer from 'nodemailer';
import ejs from 'ejs';
import path from 'path';
import fs from 'fs/promises';
import { MailOptions, TemplateData } from '../models/inerfaces/index';

const mailConfig = {
  host: process.env.SENDGRID_HOST || 'smtp.sendgrid.net',
  port: parseInt(process.env.SENDGRID_PORT || '587'),
  secure: process.env.SENDGRID_SECURE === 'true',
  auth: {
    // SendGrid SMTP relay convention: username is always the literal string "apikey"
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY,
  },
  from: {
    name: process.env.EMAIL_FROM_NAME || 'Your App Name',
    address: process.env.EMAIL_FROM_ADDRESS || 'noreply@yourapp.com',
  },
};

// Create transporter instance
// Explicit timeouts so an unreachable/slow SMTP host fails fast instead of hanging the
// request indefinitely — callers on the request path (e.g. employee creation) await
// sendMail() and need a bounded wait to turn a failure into a non-blocking warning.
const transporter = nodemailer.createTransport({
  host: mailConfig.host,
  port: mailConfig.port,
  secure: mailConfig.secure,
  auth: mailConfig.auth,
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 15_000,
});

// Templates path
const templatesPath = path.join(__dirname, '../templates/emails');

// Verify mail connection
export const verifyMailConnection = async (): Promise<boolean> => {
  try {
    await transporter.verify();
    console.log('✅ Mail service connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Mail service connection failed:', error);
    return false;
  }
};

// Load email template
const loadTemplate = async (templateName: string): Promise<string> => {
  try {
    const templatePath = path.join(templatesPath, `${templateName}.ejs`);
    const template = await fs.readFile(templatePath, 'utf-8');
    return template;
  } catch (error) {
    throw new Error(`Template ${templateName} not found`);
  }
};

// Render template with data
const renderTemplate = async (templateName: string, data: TemplateData): Promise<string> => {
  try {
    const template = await loadTemplate(templateName);
    return ejs.render(template, data);
  } catch (error) {
    console.error('Template rendering error:', error);
    throw error;
  }
};

// Main send mail function
export const sendMail = async (options: MailOptions): Promise<boolean> => {
  try {
    let htmlContent = options.html;

    // If template is specified, render it
    if (options.template && options.data) {
      htmlContent = await renderTemplate(options.template, options.data);
    }

    const mailOptions = {
      from: `${mailConfig.from.name} <${mailConfig.from.address}>`,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html: htmlContent,
      text: options.text,
      attachments: options.attachments,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', result.messageId);
    return true;
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    return false;
  }
};

// Send welcome email (optionally with a "Set Your Password" link for a newly created employee)
export const sendWelcomeEmail = async (
  to: string,
  userData: { name: string; email: string; setPasswordLink?: string }
): Promise<boolean> => {
  return sendMail({
    to,
    subject: 'Welcome to OTS HRM — set up your account',
    template: 'welcome',
    data: userData,
    // A plain-text alternative alongside the HTML part is a meaningful spam-score signal
    // (HTML-only mail from a new/unauthenticated sending domain is treated with more suspicion).
    text: userData.setPasswordLink
      ? `Welcome to OTS HRM, ${userData.name}.\n\nYour login email is ${userData.email}.\n\nSet your password here: ${userData.setPasswordLink}\n\nThis link expires in 3 days. If you weren't expecting this email, you can ignore it.`
      : `Welcome to OTS HRM, ${userData.name}. Your login email is ${userData.email}.`,
  });
};

// Send a "Set Your Password" link to an existing employee, triggered by an admin instead of
// setting/viewing a plaintext password directly (see EmployeeService.sendSetPasswordEmail).
export const sendSetPasswordEmail = async (
  to: string,
  userData: { name: string; email: string; setPasswordLink: string }
): Promise<boolean> => {
  return sendMail({
    to,
    subject: 'Set a new password for your OTS HRM account',
    template: 'welcome',
    data: userData,
    text: `Hi ${userData.name},\n\nYour admin has requested a password reset for your OTS HRM account (${userData.email}).\n\nSet your new password here: ${userData.setPasswordLink}\n\nThis link expires in 3 days. If you weren't expecting this email, you can ignore it.`,
  });
};

// Send verification email
export const sendVerificationEmail = async (to: string, verifyData: { name: string; code: string }): Promise<boolean> => {
  return sendMail({
    to,
    subject: 'Verify Your Email Address',
    template: 'email-verification',
    data: verifyData,
  });
};

// Send forgot password code
export const sendForgotPasswordCode = async (to: string, forgotData: { name: string; code: string }): Promise<boolean> => {
  return sendMail({
    to,
    subject: 'Password Reset Code',
    template: 'forgot-password',
    data: forgotData,
  });
};

// Send password reset confirmation
export const sendPasswordResetConfirmation = async (to: string, userData: { name: string; email: string }): Promise<boolean> => {
  return sendMail({
    to,
    subject: 'Password Successfully Reset',
    template: 'reset-password-confirmation',
    data: userData,
  });
};

// Send an in-app notification as an email too. Best-effort: sendMail swallows errors
// and returns false, so callers can ignore the result.
export const sendNotificationEmail = async (
  to: string,
  data: { name: string; title: string; message: string }
): Promise<boolean> => {
  return sendMail({
    to,
    subject: data.title,
    template: 'notification',
    data,
  });
};

// Send custom template email
export const sendTemplateEmail = async (to: string, subject: string, templateName: string, data: TemplateData): Promise<boolean> => {
  return sendMail({
    to,
    subject,
    template: templateName,
    data,
  });
};

// Send simple HTML email
export const sendHtmlEmail = async (to: string, subject: string, htmlContent: string): Promise<boolean> => {
  return sendMail({
    to,
    subject,
    html: htmlContent,
  });
};

// Send bulk emails
export const sendBulkEmails = async (emails: string[], subject: string, template: string, data: TemplateData): Promise<boolean[]> => {
  const results = await Promise.allSettled(
    emails.map(email => 
      sendMail({
        to: email,
        subject,
        template,
        data,
      })
    )
  );

  return results.map(result => result.status === 'fulfilled' ? result.value : false);
};

// Send employment status update notice when an admin resigns/terminates/retires an employee
// (see EmployeeService.resignEmployee). Reuses the same header/body styling as the other
// transactional templates (welcome, notification) for visual consistency.
export const sendEmploymentStatusUpdateEmail = async (
  to: string,
  data: { name: string; status: string; date: string }
): Promise<boolean> => {
  return sendMail({
    to,
    subject: 'Employment Status Update — OTS HRM',
    template: 'status-update',
    data,
    text: `Dear ${data.name},\n\nYour employment status has been updated to "${data.status}," effective ${data.date}. Accordingly, your access to the OTS HRM system has been deactivated.\n\nIf you have any questions regarding this update, please contact your HR department.\n\nRegards,\nOrange Tree Systems (OTS) HR Team`,
  });
};

// Send the Late Arrival Notice to the employee themselves. Reuses the same
// header/body styling as status-update.ejs for visual consistency. Purely a
// notification email — never touches attendance status or hours calculations.
export const sendLateArrivalEmployeeEmail = async (
  to: string,
  data: { name: string; date: string; time: string; shiftStartTime: string; graceTime: string }
): Promise<boolean> => {
  return sendMail({
    to,
    subject: 'Late Arrival Notice — OTS HRM',
    template: 'late-arrival-employee',
    data,
    text: `Dear ${data.name},\n\nThis is to inform you that your check-in on ${data.date} was recorded at ${data.time}, after the shift start time of ${data.shiftStartTime} (grace period: ${data.graceTime}).\n\nIf you have any questions regarding this, please contact your HR department.\n\nRegards,\nOrange Tree Systems (OTS) HR Team`,
  });
};

// Send the Late Arrival notice to a company admin/HR user about an employee's late
// check-in. Same underlying event as sendLateArrivalEmployeeEmail, worded for an
// HR audience instead of the employee.
export const sendLateArrivalAdminEmail = async (
  to: string,
  data: { employeeName: string; date: string; time: string; shiftStartTime: string; graceTime: string }
): Promise<boolean> => {
  return sendMail({
    to,
    subject: `Late Arrival — ${data.employeeName}`,
    template: 'late-arrival-admin',
    data,
    text: `Dear HR Team,\n\nThis is to inform you that ${data.employeeName} checked in on ${data.date} at ${data.time}, after the shift start time of ${data.shiftStartTime} (grace period: ${data.graceTime}).\n\nRegards,\nOTS HRM System`,
  });
};

// Send a "Happy Birthday" note to the employee themselves. Reuses the same
// header/body styling as the other transactional templates for visual consistency.
export const sendBirthdayEmployeeEmail = async (
  to: string,
  data: { name: string }
): Promise<boolean> => {
  return sendMail({
    to,
    subject: 'Happy Birthday! — OTS HRM',
    template: 'birthday-employee',
    data,
    text: `Dear ${data.name},\n\nWishing you a very happy birthday! We hope your day is filled with joy and good celebration.\n\nThank you for being a valued part of our team - we're glad to have you with us.\n\nRegards,\nOrange Tree Systems (OTS) HR Team`,
  });
};

// Notify a company admin/HR user that today is an employee's birthday.
export const sendBirthdayAdminEmail = async (
  to: string,
  data: { employeeName: string }
): Promise<boolean> => {
  return sendMail({
    to,
    subject: `Employee Birthday Today — ${data.employeeName}`,
    template: 'birthday-admin',
    data,
    text: `Dear HR Team,\n\nToday is ${data.employeeName}'s birthday.\n\nConsider reaching out to help celebrate their day!\n\nRegards,\nOTS HRM System`,
  });
};

// Send a "Happy Work Anniversary" note to the employee themselves. `ordinal` is a
// pre-formatted string like "3rd" (see formatOrdinal in string-utility.ts).
export const sendAnniversaryEmployeeEmail = async (
  to: string,
  data: { name: string; ordinal: string }
): Promise<boolean> => {
  return sendMail({
    to,
    subject: 'Happy Work Anniversary! — OTS HRM',
    template: 'anniversary-employee',
    data,
    text: `Dear ${data.name},\n\nCongratulations on celebrating your ${data.ordinal} year with us!\n\nThank you for your continued dedication and the contributions you've made along the way. We're grateful to have you on the team.\n\nRegards,\nOrange Tree Systems (OTS) HR Team`,
  });
};

// Notify a company admin/HR user that today is an employee's Nth work anniversary.
export const sendAnniversaryAdminEmail = async (
  to: string,
  data: { employeeName: string; ordinal: string }
): Promise<boolean> => {
  return sendMail({
    to,
    subject: `Employee Work Anniversary Today — ${data.employeeName}`,
    template: 'anniversary-admin',
    data,
    text: `Dear HR Team,\n\nToday marks ${data.employeeName}'s ${data.ordinal} work anniversary with the company.\n\nConsider reaching out to congratulate them!\n\nRegards,\nOTS HRM System`,
  });
};

// Send invite email
export const sendInviteEmail = async (
  to: string, 
  inviteData: { 
    email: string;
    role: string;
    companyName: string;
    inviteLink: string;
    invitedBy?: string;
    companyDescription?: string;
    supportEmail?: string;
  }
): Promise<boolean> => {
  return sendMail({
    to,
    subject: `You're invited to join ${inviteData.companyName}${inviteData.role === 'admin' ? ' as Administrator' : ' as Employee'}`,
    template: 'invite-email',
    data: inviteData,
  });
};
