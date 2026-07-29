import { CommonRoutes } from "../constants";
import { formatStringToTitleCase } from ".";

export const logDetailGenerator = (url: string, method: string): {model: string, detail: string} => {
    let urlSplit = url.split('/');
    let controllerIndex = urlSplit.findIndex(x => x === 'api') + 1;
    const controller = urlSplit[controllerIndex];

    let result = {model: '', detail: ''};
            result.model = formatStringToTitleCase(controller);
            result.detail = getDetails(result.model,controller, url, method);

    return result;
}


const getDetails = (model: string, controller: string, url: string, method: string): string => {
    const splitUrl = url.split('/');
    const controllerIndex = splitUrl.indexOf(controller);
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i; // UUID pattern
    const isBase64Like = /^[A-Za-z0-9_-]{16,}$/; // Base64-like string (at least 16 characters)
    if(controllerIndex !== -1) {

        if (method.toLowerCase() === 'post' && splitUrl[controllerIndex + 1] === CommonRoutes.create) 
            return `Creating a ${model}.`;
        
        if (method.toLowerCase() === 'post' && url.includes('query')) 
            return `Getting ${model} with query.`;
        
        if (method.toLowerCase() === 'get' && splitUrl[controllerIndex + 2]?.match(isUUID)) 
            return `Getting ${model} by UUID.`;

        if (method.toLowerCase() === 'get' && splitUrl[controllerIndex + 2]?.match(isBase64Like)) 
            return `Getting ${model} by Base64-like ID.`;
        
        if (method.toLowerCase() === 'get' && splitUrl[controllerIndex + 1] === 'me') 
            return `Getting current user by id.`;
        
        if (method.toLowerCase() === 'get' && splitUrl[controllerIndex + 1] === CommonRoutes.getAll) 
            return `Getting all ${model}.`;
        
        if (method.toLowerCase() === 'post' && splitUrl[controllerIndex + 1] === CommonRoutes.getAll) 
            return `Getting all ${model}.`;
        
        // Updated logger conditions
        if (method.toLowerCase() === 'put' && splitUrl[controllerIndex + 1] === 'update' && splitUrl[controllerIndex + 2]?.match(isUUID)) 
            return `Updating ${model} by UUID.`;
        
        if (method.toLowerCase() === 'put' && splitUrl[controllerIndex + 1] === 'update' && splitUrl[controllerIndex + 2]?.match(isBase64Like)) 
            return `Updating ${model} by Base64-like ID.`;
        
        if (method.toLowerCase() === 'delete' && splitUrl[controllerIndex + 1] === 'delete' && splitUrl[controllerIndex + 2]?.match(isUUID)) 
            return `Deleting ${model} by UUID.`;
        
        if (method.toLowerCase() === 'delete' && splitUrl[controllerIndex + 1] === 'delete' && splitUrl[controllerIndex + 2]?.match(isBase64Like)) 
            return `Deleting ${model} by Base64-like ID.`;
        
        if (method.toLowerCase() === 'get' && splitUrl[controllerIndex + 1] === CommonRoutes.getAll) 
            return `Getting ${model} by filter.`;
        
        if (method.toLowerCase() === 'put' && splitUrl[controllerIndex + 1] === 'disable') 
            return `Disabling ${model}.`;
        
        if (method.toLowerCase() === 'put' && splitUrl[controllerIndex + 1] === 'enable') 
            return `Enabling ${model}.`;
        
        if (method.toLowerCase() === 'get' && splitUrl[controllerIndex + 1] === 'dropdown') 
            return `Getting dropdown options for ${model}.`;

        if (
            method.toLowerCase() === 'put' &&
            splitUrl[controllerIndex + 1] === 'reset_password' &&
            splitUrl[controllerIndex + 2]?.match(isBase64Like)
        ) {
            return `Resetting password for user with authorized access by Base64-like ID.`;
        }

        if (
            method.toLowerCase() === 'put' &&
            splitUrl[controllerIndex + 1] === 'reset_password_unauthed' &&
            splitUrl[controllerIndex + 2]?.match(isBase64Like)
        ) {
            return `Resetting password for user without authorized access by Base64-like ID.`;
        }

        if (
            method.toLowerCase() === 'put' &&
            splitUrl[controllerIndex + 1] === 'reset_password' &&
            splitUrl[controllerIndex + 2]?.match(isUUID)
        ) {
            return `Resetting password for user with authorized access by UUID.`;
        }

        if (
            method.toLowerCase() === 'put' &&
            splitUrl[controllerIndex + 1] === 'reset_password_unauthed' &&
            splitUrl[controllerIndex + 2]?.match(isUUID)
        ) {
            return `Resetting password for user without authorized access by UUID.`;
        }

        
        if (method.toLowerCase() === 'post' && splitUrl[controllerIndex + 1] === 'check_existing_user') 
            return `Checking if user exists for ${model}.`;
        
        if (method.toLowerCase() === 'post' && splitUrl[controllerIndex + 1] === 'check_by_email_or_username') 
            return `Checking if user exists by email or username for ${model}.`;
        
        if (method.toLowerCase() === 'post' && splitUrl[controllerIndex + 1] === 'get_user_dropdown') 
            return `Fetching dropdown options for ${model}.`;
        
        if (method.toLowerCase() === 'get' && splitUrl[controllerIndex + 1] === 'login_as_member' && splitUrl[controllerIndex + 1]?.length === 24) 
            return `Logging in as member for ${model}.`;
        
        if (method.toLowerCase() === 'get' && splitUrl[controllerIndex + 1] === 'get_members_by_class') 
            return `Fetching members by class for ${model}.`;
        
        if (method.toLowerCase() === 'post' && splitUrl[controllerIndex + 1] === 'update_profile_pic') 
            return `Updating profile picture for ${model}.`;

        if (
            method.toLowerCase() === 'get' &&
            splitUrl[controllerIndex] === 'get_by_meeting_id_and_user_id' &&
            splitUrl[controllerIndex + 1]?.match(isUUID || isBase64Like) &&
            splitUrl[controllerIndex + 2]?.match(isUUID || isBase64Like)
        ) {
            return `Fetching achievement journal by meeting ID and user ID for ${model}.`;
        }

        if (
            method.toLowerCase() === 'get' &&
            splitUrl[controllerIndex + 1] === 'get_active_agreement' &&
            splitUrl[controllerIndex + 2]?.match(isUUID || isBase64Like) &&
            splitUrl[controllerIndex + 3]?.match(isUUID || isBase64Like)
        ) {
            return `Fetching active agreement by user ID and license ID for ${model}.`;
        }

        if (
            method.toLowerCase() === 'post' &&
            splitUrl[controllerIndex + 1] === 'add_comment' &&
            splitUrl[controllerIndex + 2]?.match(isUUID || isBase64Like)
        ) {
            return `Adding a comment to the discussion with ID ${splitUrl[controllerIndex + 2]} for ${model}.`;
        }

        if (
            method.toLowerCase() === 'post' &&
            splitUrl[controllerIndex + 1] === 'get_paged_download_history' &&
            splitUrl[controllerIndex + 2]
        ) {
            return `Fetching paged download history for download type ${splitUrl[controllerIndex + 2]} for ${model}.`;
        }

        if (method.toLowerCase() === 'get' && splitUrl[controllerIndex + 1] === 'pending_gray_dates') {
            return `Fetching all pending gray dates for ${model}.`;
        }

        if (
            method.toLowerCase() === 'get' &&
            splitUrl[controllerIndex + 1] === 'get_by_user_id' &&
            splitUrl[controllerIndex + 2]?.match(isUUID || isBase64Like)
        ) {
            return `Fetching gray dates for user with ID ${splitUrl[controllerIndex + 2]} for ${model}.`;
        }
        
        if (method.toLowerCase() === 'put' && splitUrl[controllerIndex + 1] === 'decline') {
            return `Declining a gray date for ${model}.`;
        }        
        
        if (method.toLowerCase() === 'put' && splitUrl[controllerIndex + 1] === 'approve') {
            return `Approving a gray date for ${model}.`;
        }

        if (
            method.toLowerCase() === 'get' &&
            splitUrl[controllerIndex + 1] === 'get_group_gray_dates_by_group_id' &&
            splitUrl[controllerIndex + 2]
        ) {
            return `Fetching gray dates for group with ID ${splitUrl[controllerIndex + 2]} for ${model}.`;
        }
        
        if (method.toLowerCase() === 'post' && splitUrl[controllerIndex + 1] === 'get_by_date_range') {
            return `Fetching group gray dates within a specified date range for ${model}.`;
        }
        
        if (method.toLowerCase() === 'post' && splitUrl[controllerIndex + 1] === 'get_paged_files_by_query') {
            return `Fetching paged material files based on query for ${model}.`;
        }
        
        if (
            method.toLowerCase() === 'get' &&
            splitUrl[controllerIndex + 1] === 'get_by_group_id' &&
            splitUrl[controllerIndex + 2]?.match(isUUID || isBase64Like)
        ) {
            return `Fetching materials for group with ID ${splitUrl[controllerIndex + 2]} for ${model}.`;
        }

        if (method.toLowerCase() === 'get' && splitUrl[controllerIndex + 1] === 'get_joint') {
            return `Fetching joint materials for ${model}.`;
        }
        
        if (
            method.toLowerCase() === 'get' &&
            splitUrl[controllerIndex + 1] === 'get_by_material_id' &&
            splitUrl[controllerIndex + 2]?.match(isUUID || isBase64Like)
        ) {
            return `Fetching material tabs for material ID ${splitUrl[controllerIndex + 2]} for ${model}.`;
        }
        
        if (
            method.toLowerCase() === 'put' &&
            splitUrl[controllerIndex + 1] === 'rank_up' &&
            splitUrl[controllerIndex + 2]?.match(isUUID || isBase64Like)
        ) {
            return `Ranking up material tab with ID ${splitUrl[controllerIndex + 2]} for ${model}.`;
        }
        
        if (
            method.toLowerCase() === 'put' &&
            splitUrl[controllerIndex + 1] === 'rank_down' &&
            splitUrl[controllerIndex + 2]?.match(isUUID || isBase64Like)
        ) {
            return `Ranking down material tab with ID ${splitUrl[controllerIndex + 2]} for ${model}.`;
        }

        if (
            method.toLowerCase() === 'post' &&
            splitUrl[controllerIndex + 1] === 'add_material_tab_file' &&
            splitUrl[controllerIndex + 2] &&
            splitUrl[controllerIndex + 3] &&
            splitUrl[controllerIndex + 4] &&
            splitUrl[controllerIndex + 5]
        ) {
            return `Adding material tab file for material ID ${splitUrl[controllerIndex + 2]}, tab ID ${splitUrl[controllerIndex + 3]}, file name ${splitUrl[controllerIndex + 4]}, and license ID ${splitUrl[controllerIndex + 5]} for ${model}.`;
        }
        
        if (
            method.toLowerCase() === 'get' &&
            splitUrl[controllerIndex + 1] === 'get_material_files_by_tab_id' &&
            splitUrl[controllerIndex + 2]?.match(isUUID || isBase64Like)
        ) {
            return `Fetching material files for tab ID ${splitUrl[controllerIndex + 2]} for ${model}.`;
        }
        
        if (method.toLowerCase() === 'get' && splitUrl[controllerIndex + 1] === 'get_all_material_files') {
            return `Fetching all material tab files for ${model}.`;
        }
        
        if (
            method.toLowerCase() === 'get' &&
            splitUrl[controllerIndex + 1] === 'get_file' &&
            splitUrl[controllerIndex + 2]?.match(isUUID || isBase64Like)
        ) {
            return `Fetching material file with ID ${splitUrl[controllerIndex + 2]} for ${model}.`;
        }
        
        if (
            method.toLowerCase() === 'get' &&
            splitUrl[controllerIndex + 1] === 'download_file' &&
            splitUrl[controllerIndex + 2]?.match(isUUID || isBase64Like)
        ) {
            return `Downloading material file with ID ${splitUrl[controllerIndex + 2]} for ${model}.`;
        }
        
        if (
            method.toLowerCase() === 'put' &&
            splitUrl[controllerIndex + 1] === 'update_file' &&
            splitUrl[controllerIndex + 2]?.match(isUUID || isBase64Like)
        ) {
            return `Updating file name for material tab file with ID ${splitUrl[controllerIndex + 2]} for ${model}.`;
        }

        if (
            method.toLowerCase() === 'delete' &&
            splitUrl[controllerIndex + 1] === 'delete_file' &&
            splitUrl[controllerIndex + 2]?.match(isUUID || isBase64Like)
        ) {
            return `Deleting material tab file with ID ${splitUrl[controllerIndex + 2]} for ${model}.`;
        }
        
        if (
            method.toLowerCase() === 'post' &&
            splitUrl[controllerIndex + 1] === 'add_report_file' &&
            splitUrl[controllerIndex + 2]?.match(isUUID || isBase64Like)
        ) {
            return `Adding report file for report ID ${splitUrl[controllerIndex + 2]} for ${model}.`;
        }
        
        if (
            method.toLowerCase() === 'get' &&
            splitUrl[controllerIndex + 1] === 'get_drafted_report' &&
            splitUrl[controllerIndex + 2]?.match(isUUID || isBase64Like)
        ) {
            return `Fetching drafted report for user ID ${splitUrl[controllerIndex + 2]} for ${model}.`;
        }

        if (
            method.toLowerCase() === 'get' &&
            splitUrl[controllerIndex + 1] === 'get_report_files' &&
            splitUrl[controllerIndex + 2]?.match(isUUID || isBase64Like)
        ) {
            return `Fetching report files for report ID ${splitUrl[controllerIndex + 2]} for ${model}.`;
        }
        
        if (
            method.toLowerCase() === 'put' &&
            splitUrl[controllerIndex + 1] === 'submit_report' &&
            splitUrl[controllerIndex + 2]?.match(isUUID || isBase64Like)
        ) {
            return `Submitting report with ID ${splitUrl[controllerIndex + 2]} for ${model}.`;
        }
        
        if (method.toLowerCase() === 'get' && splitUrl[controllerIndex + 1] === 'get_current_day_reports') {
            return `Fetching current day's reports for ${model}.`;
        }

        if (
            method.toLowerCase() === 'get' &&
            splitUrl[controllerIndex + 1] === 'get_submitted_report_today' &&
            splitUrl[controllerIndex + 2]?.match(isUUID || isBase64Like)
        ) {
            return `Fetching today's submitted report for user ID ${splitUrl[controllerIndex + 2]} for ${model}.`;
        }

        if (
            method.toLowerCase() === 'get' &&
            splitUrl[controllerIndex + 1] === 'download_report_file' &&
            splitUrl[controllerIndex + 2]?.match(isUUID || isBase64Like)
        ) {
            return `Downloading report file with ID ${splitUrl[controllerIndex + 2]} for ${model}.`;
        }
        
        if (
            method.toLowerCase() === 'get' &&
            splitUrl[controllerIndex + 1] === 'allow_next_day' &&
            splitUrl[controllerIndex + 2]?.match(isUUID || isBase64Like)
        ) {
            return `Checking permission to allow next-day report for user ID ${splitUrl[controllerIndex + 2]} for ${model}.`;
        }
        
        if (
            method.toLowerCase() === 'get' &&
            splitUrl[controllerIndex + 1] === 'next_day_report' &&
            splitUrl[controllerIndex + 2]?.match(isUUID || isBase64Like)
        ) {
            return `Fetching next-day report for user ID ${splitUrl[controllerIndex + 2]} for ${model}.`;
        }

        if (
            method.toLowerCase() === 'get' &&
            splitUrl[controllerIndex + 1] === 'friday_report_and_monday_permission_status' &&
            splitUrl[controllerIndex + 2]?.match(isUUID || isBase64Like)
        ) {
            return `Checking Friday report and Monday permission status for user ID ${splitUrl[controllerIndex + 2]} for ${model}.`;
        }
        
        if (
            method.toLowerCase() === 'delete' &&
            splitUrl[controllerIndex + 1] === 'delete_report_file' &&
            splitUrl[controllerIndex + 2]?.match(isUUID || isBase64Like)
        ) {
            return `Deleting report file with ID ${splitUrl[controllerIndex + 2]} for ${model}.`;
        }

        if (method.toLowerCase() === 'post' && splitUrl[controllerIndex + 1] === 'submit_monday_report') {
            return `Submitting Monday report for ${model}.`;
        }

        if (method.toLowerCase() === 'post' && splitUrl[controllerIndex + 1] === 'submit_user_report_by_admin') {
            return `Admin submitting user report for ${model}.`;
        }
        
        if (method.toLowerCase() === 'post' && splitUrl[controllerIndex + 1] === 'get_report_by_date') {
            return `Fetching report by date for ${model}.`;
        }
        
        if (method.toLowerCase() === 'get' && splitUrl[controllerIndex + 1] === 'get_user_reports_by_filters') {
            return `Fetching user reports by filters for ${model}.`;
        }
        
        if (
            method.toLowerCase() === 'get' &&
            splitUrl[controllerIndex + 1] === 'verify' &&
            splitUrl[controllerIndex + 2]?.match(isUUID || isBase64Like)
        ) {
            return `Verifying entity with ID ${splitUrl[controllerIndex + 2]} for ${model}.`;
        } 
        
        if (
            method.toLowerCase() === 'post' &&
            splitUrl[controllerIndex + 1] === 'get_by_group_id'
        ) {
            return `Fetching announcements by group ID for ${model}.`;
        }

        if (
            method.toLowerCase() === 'get' &&
            splitUrl[controllerIndex + 1] === 'active_groups'
        ) {
            return `Fetching active groups.`;
        }

        if (
            method.toLowerCase() === 'post' &&
            splitUrl[controllerIndex + 1] === 'login'
        ) {
            return `Logging in user.`;
        }
        
    }
    return 'Invalid controller';
}
