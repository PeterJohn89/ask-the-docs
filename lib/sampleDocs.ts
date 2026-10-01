export type Doc = { id: string; title: string; text: string; sample?: boolean };

// A small made up team handbook so the app can be tried straight away.
export const sampleDocs: Doc[] = [
  {
    id: "deploy",
    title: "Deployment SOP",
    sample: true,
    text: `# Deployment SOP

## Before you deploy
Every change must have a ticket number in the commit message and an approved pull request. Run the test suite locally and check the staging site in Chrome and Safari.

## Deploy window
Production deploys happen Tuesday to Thursday between 9am and 2pm AEST. Never deploy on a Friday or before a public holiday unless it is a critical security fix approved by the lead developer.

## How to deploy
Merge the pull request into main. The pipeline builds the site, runs tests and pushes to staging automatically. After checking staging, click Promote to Production in the pipeline. Post the release notes in the #releases channel.

## Rolling back
If something breaks, click Rollback in the pipeline to restore the previous release. Tell the account manager within 15 minutes and open an incident ticket.`,
  },
  {
    id: "portal",
    title: "Client Portal Handbook",
    sample: true,
    text: `# Client Portal Handbook

## Logging in
Clients sign in with their email address and a one time code sent by email. Codes expire after 10 minutes.

## Resetting access
If a client is locked out, open Users in the admin area, find their account and click Send new login link. Never share passwords or codes over the phone.

## Compliance forms
Care workers complete the Home Safety Assessment and Medication Checklist inside the portal. Forms save automatically every 30 seconds and can be finished later. Submitted forms are locked and can only be reopened by a team leader.

## Reports
Team leaders can export monthly compliance reports as CSV from the Reports page. Reports include completion rates by worker and overdue forms.`,
  },
  {
    id: "care",
    title: "WordPress Care Guide",
    sample: true,
    text: `# WordPress Care Guide

## Updates
Plugin and core updates run every second Monday. Always take a full backup first and test updates on staging. Major version updates for WooCommerce or page builders need a manual review.

## Backups
Daily backups are kept for 30 days off site. To restore, open the hosting dashboard, choose Backups, pick a date and click Restore. Restores take about 10 minutes.

## Security
Every site uses two factor login for admins, a firewall plugin and uptime monitoring. Remove admin accounts for staff who leave within one business day.

## Speed
Images are compressed on upload and served as WebP. If a page scores under 80 on PageSpeed mobile, check for unoptimised images and unused plugins first.`,
  },
];
