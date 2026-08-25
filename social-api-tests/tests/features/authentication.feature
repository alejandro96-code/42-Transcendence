Feature: Authentication

  Scenario: A new user registers
    Given I have a unique user
    When I register the user
    Then the registration should succeed

  Scenario: A registered user logs in
    Given I have a registered user
    When I login as that user
    Then the login should succeed
    And I should receive an authentication token