Feature: Authentication

  Scenario: Register a new user
    Given I have a new user
    When I register the user
    Then the registration should be successful