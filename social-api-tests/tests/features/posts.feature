Feature: Posts

  Scenario Outline: User creates a post
    Given the user "<name>" is registered
    And "<name>" has a session token
    When "<name>" creates a post with content "I am <name> and this is my first post"
    Then the post should be created successfully
    And the post content should be "I am <name> and this is my first post"

    Examples:
      | name  |
      | Alice |
      | Bob   |