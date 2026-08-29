Feature: Chat

  Scenario Outline: User sends a message to another user
    Given the user "<sender>" is registered
    And the user "<receiver>" is registered
    And "<sender>" has a session token
    When "<sender>" sends a message to "<receiver>" saying "Hello <receiver>!"
    Then the message from "<sender>" to "<receiver>" should be sent successfully

    Examples:
      | sender | receiver |
      | Alice  | Bob      |
      | Bob    | Alice    |