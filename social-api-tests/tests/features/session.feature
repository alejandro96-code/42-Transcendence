Feature: Session

  Scenario Outline: Get a session token for a registered user
    Given the user "<name>" is registered
    When I get a session token for "<name>"
    Then "<name>" should have a valid session token

    Examples:
      | name  |
      | Alice |
      | Bob   |