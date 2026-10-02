// Test files are not the application's code: their raw elements are not counted.
import { Component } from '@angular/core';

@Component({ selector: 'app-host', template: '<button type="button">Host</button>' })
export class Host {}
