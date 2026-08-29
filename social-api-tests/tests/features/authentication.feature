Feature: Authentication

  Scenario Outline: Register a new user
    Given I have a new user named "<name>"
    When I register the user "<name>"
    Then the registration of "<name>" should be successful

    Examples:
      | name  |
      | Alice |
      | Bob   |