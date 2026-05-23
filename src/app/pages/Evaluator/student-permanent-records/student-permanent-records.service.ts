import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { StudentsService } from '../../Registrar/students/students.service';
import { SearchableSelectOption } from '../../../shared/components/searchable-select/searchable-select-option.model';
import { SORT_DEFAULTS } from '../../../shared/constants/sort.constant';

const STUDENT_LIST_PARAMS = {
  PageIndex: 1,
  PageSize: 500,
  SortDirection: SORT_DEFAULTS.DIRECTION,
  SortKey: 'student_number',
  status: 'Active'
} as const;

@Injectable({ providedIn: 'root' })
export class StudentPermanentRecordsService {
  private readonly studentsService = inject(StudentsService);

  getStudentOptions(): Observable<SearchableSelectOption[]> {
    return this.studentsService.getStudents(STUDENT_LIST_PARAMS).pipe(
      map((response) =>
        (response.data ?? []).map((student) => ({
          id: String(student.id),
          primary: `${student.studentNumber} - ${student.lastName}, ${student.firstName}`,
          secondary: `${student.programCode} - ${student.yearLevel}`
        }))
      )
    );
  }
}
