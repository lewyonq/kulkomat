import { Injectable, inject } from '@angular/core';
import { from, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import {
  CreateContactSubmissionCommand,
  CreateContactSubmissionResponseDTO,
} from '../types';

/**
 * Contact Service
 *
 * Manages contact form submission operations.
 * Uses AuthService for authentication state and Supabase client access.
 */
@Injectable({
  providedIn: 'root',
})
export class ContactService {
  private authService = inject(AuthService);

  /**
   * Submit Contact Form
   * Creates a new contact submission in the database
   *
   * @param command - Contact submission data (message required)
   * @returns Observable<CreateContactSubmissionResponseDTO> - Created submission data
   */
  submit(command: CreateContactSubmissionCommand): Observable<CreateContactSubmissionResponseDTO> {
    const currentUser = this.authService.user();
    if (!currentUser) {
      return throwError(() => new Error('User not authenticated'));
    }

    // Prepare submission data with user's email
    const submissionData = {
      user_id: currentUser.id,
      email: currentUser.email,
      message: command.message,
    };

    return from(
      this.authService.client
        .from('contact_submissions')
        .insert(submissionData)
        .select('id, message, created_at')
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw error;
        }

        if (!data) {
          throw new Error('Failed to create contact submission');
        }

        return {
          id: data.id,
          message: data.message,
          created_at: data.created_at,
        } as CreateContactSubmissionResponseDTO;
      }),
      catchError((err) => {
        const errorMessage = err?.message || 'Failed to submit contact form';
        console.error('Error submitting contact form:', errorMessage);
        return throwError(() => new Error(errorMessage));
      }),
    );
  }
}
