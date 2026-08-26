Feature: Posts

  Scenario: A user creates a post
    Given a registered user exists
    And the user is logged in
    When the user makes a post saying "Hello world!"
    Then the post should be created successfully