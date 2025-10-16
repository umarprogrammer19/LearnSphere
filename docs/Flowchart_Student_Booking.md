# Flowchart: Student Booking a Tutor

This flowchart illustrates the step-by-step process a student follows to find and book a tutoring session on the LearnSphere platform.

```mermaid
graph TD
    A[Start] --> B{User Visits LearnSphere};
    B --> C{Is User Logged In?};
    C -- No --> D[Redirect to Login/Signup Page];
    D --> E[User Logs In or Signs Up];
    E --> F[Navigate to "Find a Tutor" Page];
    C -- Yes --> F;

    F --> G[User Searches/Filters Tutors];
    G --> H[System Displays Tutor List];
    H --> I[User Selects a Tutor];
    I --> J[View Tutor Profile Page];
    J --> K[User Clicks "Book a Session"];
    K --> L[Booking Modal Opens];

    subgraph Booking Process
        L --> M[User Selects Time Slot & Session Type];
        M --> N{Session Type is "On-site"?};
        N -- Yes --> O[User Selects Payment: Card or Cash];
        N -- No (Online) --> P[Payment Method is Card];
        O --> Q{Pay with Card?};
        Q -- No (Pay Cash) --> R[Submit Booking Request with "cash_pending" status];
        Q -- Yes --> S[Proceed to Stripe Checkout];
        P --> S;
    end

    S --> T{Payment Successful?};
    T -- Yes --> U[Update Booking: paymentStatus = "paid"];
    T -- No --> V[Redirect to "Find a Tutor" with Error];
    U --> W[Booking Request Sent to Tutor];
    R --> W;

    W --> X[Student & Tutor see "Pending" booking in Dashboard];
    X --> Y{Tutor Accepts Booking?};
    Y -- Yes --> Z[Update Booking: lessonConfirmed = true. Decrement tutor's available seats.];
    Y -- No --> AA[Update Booking: lessonConfirmed = false, status = "rejected"];
    Z --> AB[Student & Tutor Notified. Booking appears in "Upcoming"];
    AA --> AC[Student Notified. Booking is marked as Rejected];
    AC --> AD[End];
    AB --> AD;
```
