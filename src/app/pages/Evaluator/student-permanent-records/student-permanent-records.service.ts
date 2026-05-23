import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { MOCK_EVALUATOR_STUDENT_PERMANENT_RECORDS } from '../../../../mock-data/evaluator/student-permanent-records.mock';
import { SearchableSelectOption } from '../../../shared/components/searchable-select/searchable-select-option.model';

@Injectable({ providedIn: 'root' })
export class StudentPermanentRecordsService {
  getStudentOptions(): Observable<SearchableSelectOption[]> {
    const options: SearchableSelectOption[] = MOCK_EVALUATOR_STUDENT_PERMANENT_RECORDS.map((r) => ({
      id: r.studentId,
      primary: `${r.studentId} - ${r.lastName}, ${r.firstName}`,
      secondary: `${r.programCode} - ${r.yearLevel}`
    }));
    return of(options);
  }
}
